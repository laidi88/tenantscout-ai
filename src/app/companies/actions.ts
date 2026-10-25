"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/mutations";
import {
  companySchema,
  formDataToObject,
  signalSchema,
  validationFailure,
  type FormState,
} from "@/lib/validation";

function parseCompany(formData: FormData) {
  const values = formDataToObject(formData, ["preferredPropertyTypes"]);
  return { values, result: companySchema.safeParse(values) };
}

export async function createCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const { values, result } = parseCompany(formData);
  if (!result.success) return validationFailure(result.error, values);

  const company = isDemoMode()
    ? demo.createCompany(result.data)
    : await getDb().tenantCompany.create({ data: result.data });
  revalidatePath("/", "layout");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { values, result } = parseCompany(formData);
  if (!result.success) return validationFailure(result.error, values);

  if (isDemoMode()) demo.updateCompany(id, result.data);
  else await getDb().tenantCompany.update({ where: { id }, data: result.data });
  revalidatePath("/", "layout");
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  // Signals, leads and notes for this company are deleted with it.
  if (isDemoMode()) demo.deleteCompany(id);
  else await getDb().tenantCompany.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/companies");
}

export async function addSignal(companyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formDataToObject(formData);
  const result = signalSchema.safeParse(values);
  if (!result.success) return validationFailure(result.error, values);

  // Signals entered through this form are always recorded manually.
  if (isDemoMode()) demo.addSignal(companyId, result.data);
  else await getDb().signal.create({ data: { ...result.data, companyId, origin: "MANUAL" } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Signal added. Generate matches on the Leads page to update scores." };
}

export async function deleteSignal(id: string, companyId: string) {
  if (isDemoMode()) demo.deleteSignal(id);
  else await getDb().signal.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect(`/companies/${companyId}`);
}
