// Loads the fictional demo data into the database in DATABASE_URL.
// Run with `npm run db:seed`. Safe to run more than once: demo records use
// fixed IDs and are refreshed in place; records you created yourself are not touched.
//
// With --if-empty (used on every Railway deploy) it only seeds a database that
// has no properties and no companies yet, so later deploys never overwrite
// anything. Set SEED_DEMO_DATA=false to skip it entirely.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { startOfTodayUtc } from "../src/lib/format";
import { toMatchCompany, toMatchProperty } from "../src/lib/scoring/adapters";
import { generateLeads } from "../src/lib/scoring/generate-leads";
import { scoreMatch } from "../src/lib/scoring/score";
import { DEMO_COMPANIES, DEMO_LEAD_STATES, DEMO_PROPERTIES, DEMO_SIGNALS } from "./seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. See .env.example.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  if (process.argv.includes("--if-empty")) {
    if (process.env.SEED_DEMO_DATA === "false") {
      console.log("Demo data: skipped (SEED_DEMO_DATA=false).");
      await db.$disconnect();
      return;
    }
    const [properties, companies] = await Promise.all([db.property.count(), db.tenantCompany.count()]);
    if (properties + companies > 0) {
      console.log("Demo data: skipped (database already has data).");
      await db.$disconnect();
      return;
    }
    console.log("Demo data: empty database, loading fictional demo data.");
  }

  const now = new Date();
  const today = startOfTodayUtc(now);
  const inDays = (n: number) => new Date(today.getTime() + n * DAY_MS);

  try {
    for (const { id, availableInDays, status, ...p } of DEMO_PROPERTIES) {
      const data = {
        ...p,
        availableFrom: availableInDays > 0 ? inDays(availableInDays) : null,
        status: status ?? "AVAILABLE",
      };
      await db.property.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    console.log(`Properties: ${DEMO_PROPERTIES.length}`);

    for (const { id, targetMoveInDays, ...c } of DEMO_COMPANIES) {
      const data = { ...c, targetMoveDate: targetMoveInDays == null ? null : inDays(targetMoveInDays) };
      await db.tenantCompany.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    console.log(`Companies: ${DEMO_COMPANIES.length}`);

    for (const { id, daysAgo, title, ...s } of DEMO_SIGNALS) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const data = {
        ...s,
        title,
        observedAt: inDays(-daysAgo),
        sourceUrl: `https://example.com/demo/${slug}`,
        origin: "MANUAL" as const,
      };
      await db.signal.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    console.log(`Signals: ${DEMO_SIGNALS.length}`);

    const summary = await generateLeads(now, db);
    console.log(`Leads: ${summary.leadsCreated} created, ${summary.leadsRescored} rescored`);

    // Give a few demo leads a realistic pipeline status, follow-up and notes.
    for (const state of DEMO_LEAD_STATES) {
      const pair = { companyId: state.companyId, propertyId: state.propertyId };
      const [company, property] = await Promise.all([
        db.tenantCompany.findUniqueOrThrow({
          where: { id: state.companyId },
          include: { signals: { select: { observedAt: true, strength: true } } },
        }),
        db.property.findUniqueOrThrow({ where: { id: state.propertyId } }),
      ]);
      const breakdown = scoreMatch(toMatchCompany(company), toMatchProperty(property), company.signals, now);
      const leadData = {
        status: state.status,
        followUpDate: state.followUpInDays == null ? null : inDays(state.followUpInDays),
        ownerName: state.ownerName,
        score: breakdown.total,
        scoreBreakdown: breakdown,
        scoredAt: now,
      };
      const lead = await db.lead.upsert({
        where: { companyId_propertyId: pair },
        create: { ...pair, ...leadData },
        update: leadData,
      });
      for (const note of state.notes) {
        const noteData = { leadId: lead.id, body: note.body, createdAt: new Date(now.getTime() - note.daysAgo * DAY_MS) };
        await db.note.upsert({ where: { id: note.id }, create: { id: note.id, ...noteData }, update: noteData });
      }
    }
    console.log(`Demo pipeline states applied: ${DEMO_LEAD_STATES.length}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
