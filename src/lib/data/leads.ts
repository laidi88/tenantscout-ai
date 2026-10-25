import "server-only";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { LeadStatus } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/queries";
import { startOfTodayUtc } from "@/lib/format";
import { CLOSED_LEAD_STATUSES } from "@/lib/labels";
import type { ScoreBreakdown } from "@/lib/scoring/score";

export type LeadFilters = {
  q?: string;
  status?: LeadStatus | "ACTIVE" | "ALL";
  minScore?: number;
  followUp?: "overdue" | "week";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function listLeads(filters: LeadFilters = {}) {
  await connection();
  if (isDemoMode()) return demo.listLeads(filters);
  const where: Prisma.LeadWhereInput = {};
  if (!filters.status || filters.status === "ACTIVE") where.status = { notIn: CLOSED_LEAD_STATUSES };
  else if (filters.status !== "ALL") where.status = filters.status;
  if (filters.minScore) where.score = { gte: filters.minScore };

  const today = startOfTodayUtc();
  if (filters.followUp === "overdue") where.followUpDate = { lt: today };
  if (filters.followUp === "week") where.followUpDate = { lt: new Date(today.getTime() + 7 * DAY_MS) };

  if (filters.q) {
    where.OR = [
      { company: { name: { contains: filters.q, mode: "insensitive" } } },
      { property: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  return getDb().lead.findMany({
    where,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    include: {
      company: { select: { id: true, name: true, industry: true } },
      property: { select: { id: true, name: true, city: true, submarket: true } },
    },
  });
}

export async function getLead(id: string) {
  await connection();
  if (isDemoMode()) return demo.getLead(id);
  const lead = await getDb().lead.findUnique({
    where: { id },
    include: {
      company: { include: { signals: { orderBy: { observedAt: "desc" }, take: 3 } } },
      property: true,
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) return null;
  return { ...lead, breakdown: lead.scoreBreakdown as unknown as ScoreBreakdown };
}

export function isOverdue(followUpDate: Date | null, status: LeadStatus) {
  return followUpDate != null && !CLOSED_LEAD_STATUSES.includes(status) && followUpDate < startOfTodayUtc();
}
