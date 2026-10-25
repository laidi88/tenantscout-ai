"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/mutations";
import { toMatchCompany, toMatchProperty } from "@/lib/scoring/adapters";
import { generateLeads } from "@/lib/scoring/generate-leads";
import { scoreMatch } from "@/lib/scoring/score";
import {
  formDataToObject,
  leadUpdateSchema,
  noteSchema,
  validationFailure,
  type FormState,
} from "@/lib/validation";

/** Creates a lead for one company/property pair (from a "best matches" list). */
export async function createLead(companyId: string, propertyId: string) {
  if (isDemoMode()) {
    const leadId = demo.createLead(companyId, propertyId);
    revalidatePath("/", "layout");
    redirect(`/leads/${leadId}`);
  }
  const db = getDb();
  const existing = await db.lead.findUnique({ where: { companyId_propertyId: { companyId, propertyId } } });
  if (existing) redirect(`/leads/${existing.id}`);

  const [company, property] = await Promise.all([
    db.tenantCompany.findUniqueOrThrow({
      where: { id: companyId },
      include: { signals: { select: { observedAt: true, strength: true } } },
    }),
    db.property.findUniqueOrThrow({ where: { id: propertyId } }),
  ]);
  const now = new Date();
  const breakdown = scoreMatch(toMatchCompany(company), toMatchProperty(property), company.signals, now);
  const lead = await db.lead.create({
    data: { companyId, propertyId, score: breakdown.total, scoreBreakdown: breakdown, scoredAt: now },
  });
  revalidatePath("/", "layout");
  redirect(`/leads/${lead.id}`);
}

export async function generateMatches(): Promise<FormState> {
  const summary = isDemoMode() ? demo.generateLeads() : await generateLeads();
  revalidatePath("/", "layout");
  const created = summary.leadsCreated === 1 ? "1 new lead" : `${summary.leadsCreated} new leads`;
  return {
    ok: true,
    message: `Scored ${summary.pairsScored} company/property pairs: ${created}, ${summary.leadsRescored} existing leads rescored.`,
  };
}

export async function updateLead(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formDataToObject(formData);
  const result = leadUpdateSchema.safeParse(values);
  if (!result.success) return validationFailure(result.error, values);

  if (isDemoMode()) demo.updateLead(id, result.data);
  else await getDb().lead.update({ where: { id }, data: result.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Lead updated." };
}

export async function addNote(leadId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formDataToObject(formData);
  const result = noteSchema.safeParse(values);
  if (!result.success) return validationFailure(result.error, values);

  if (isDemoMode()) demo.addNote(leadId, result.data.body);
  else await getDb().note.create({ data: { leadId, body: result.data.body } });
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function deleteNote(noteId: string, leadId: string) {
  if (isDemoMode()) demo.deleteNote(noteId);
  else await getDb().note.delete({ where: { id: noteId } });
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLead(id: string) {
  if (isDemoMode()) demo.deleteLead(id);
  else await getDb().lead.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/leads");
}
