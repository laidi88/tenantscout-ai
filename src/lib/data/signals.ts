import "server-only";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { SignalStrength, SignalType } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";

export async function listSignals(filters: { type?: SignalType; strength?: SignalStrength; q?: string } = {}) {
  await connection();
  const where: Prisma.SignalWhereInput = {};
  if (filters.type) where.type = filters.type;
  if (filters.strength) where.strength = filters.strength;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { company: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  return getDb().signal.findMany({
    where,
    orderBy: { observedAt: "desc" },
    include: { company: { select: { id: true, name: true } } },
    take: 200,
  });
}
