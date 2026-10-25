"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/mutations";
import { formDataToObject, propertySchema, validationFailure, type FormState } from "@/lib/validation";

function parse(formData: FormData) {
  const values = formDataToObject(formData);
  return { values, result: propertySchema.safeParse(values) };
}

export async function createProperty(_prev: FormState, formData: FormData): Promise<FormState> {
  const { values, result } = parse(formData);
  if (!result.success) return validationFailure(result.error, values);

  const property = isDemoMode()
    ? demo.createProperty(result.data)
    : await getDb().property.create({ data: result.data });
  revalidatePath("/", "layout");
  redirect(`/properties/${property.id}`);
}

export async function updateProperty(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { values, result } = parse(formData);
  if (!result.success) return validationFailure(result.error, values);

  if (isDemoMode()) demo.updateProperty(id, result.data);
  else await getDb().property.update({ where: { id }, data: result.data });
  revalidatePath("/", "layout");
  redirect(`/properties/${id}`);
}

export async function deleteProperty(id: string) {
  // Leads and their notes for this property are deleted with it.
  if (isDemoMode()) demo.deleteProperty(id);
  else await getDb().property.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/properties");
}
