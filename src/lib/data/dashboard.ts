import "server-only";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/queries";
import { startOfTodayUtc } from "@/lib/format";
import { CLOSED_LEAD_STATUSES } from "@/lib/labels";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboard() {
  await connection();
  if (isDemoMode()) return demo.getDashboard();
  const db = getDb();
  const today = startOfTodayUtc();
  const weekAhead = new Date(today.getTime() + 7 * DAY_MS);
  const openLead = { status: { notIn: CLOSED_LEAD_STATUSES } };
  const leadInclude = {
    company: { select: { id: true, name: true, industry: true } },
    property: { select: { id: true, name: true, city: true, submarket: true } },
  };

  const [availableProperties, companies, openLeads, overdueCount, topLeads, followUps, statusCounts, recentSignals] =
    await Promise.all([
      db.property.count({ where: { status: "AVAILABLE" } }),
      db.tenantCompany.count(),
      db.lead.count({ where: openLead }),
      db.lead.count({ where: { ...openLead, followUpDate: { lt: today } } }),
      db.lead.findMany({ where: openLead, orderBy: { score: "desc" }, take: 8, include: leadInclude }),
      db.lead.findMany({
        where: { ...openLead, followUpDate: { lt: weekAhead } },
        orderBy: { followUpDate: "asc" },
        take: 8,
        include: leadInclude,
      }),
      db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      db.signal.findMany({
        orderBy: { observedAt: "desc" },
        take: 5,
        include: { company: { select: { id: true, name: true } } },
      }),
    ]);

  return {
    totals: { availableProperties, companies, openLeads, overdueCount },
    topLeads,
    followUps,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
    recentSignals,
  };
}
