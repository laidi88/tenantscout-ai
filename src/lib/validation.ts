import { z } from "zod";
import {
  LeadStatus,
  PropertyStatus,
  PropertyType,
  SignalStrength,
  SignalType,
} from "@/generated/prisma/enums";

// Form field helpers: HTML forms send strings, and empty or missing values mean "not set".
const blankToNull = (v: unknown) => (v == null || (typeof v === "string" && v.trim() === "") ? null : v);
const trimmed = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const requiredText = (label: string, max = 200) =>
  z.preprocess(trimmed, z.string(`${label} is required.`).min(1, `${label} is required.`).max(max, `${label} is too long.`));

const optionalText = (max = 2000) =>
  z.preprocess((v) => blankToNull(trimmed(v)), z.string().max(max, "This text is too long.").nullable());

const optionalArea = z.preprocess(
  blankToNull,
  z.coerce.number("Enter a number.").int("Use whole square metres.").positive("Must be greater than zero.").max(1_000_000, "That area looks too large.").nullable(),
);

const optionalRent = z.preprocess(
  blankToNull,
  z.coerce.number("Enter a number.").positive("Must be greater than zero.").max(10_000, "That rent looks too high.").nullable(),
);

const optionalDate = z.preprocess(
  blankToNull,
  z.coerce.date("Enter a valid date.").nullable(),
);

const requiredDate = (label: string) => z.coerce.date(`${label} is required.`);

const optionalUrl = z.preprocess(
  (v) => blankToNull(trimmed(v)),
  z.url({ message: "Enter a full URL starting with https://", protocol: /^https?$/ }).nullable(),
);

// "Berlin, Hamburg" → ["Berlin", "Hamburg"]
const commaList = z.preprocess(
  (v) =>
    typeof v === "string"
      ? [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))]
      : [],
  z.array(z.string().max(100)).max(30, "Too many entries."),
);

export const propertySchema = z
  .object({
    name: requiredText("Name"),
    addressLine: requiredText("Address"),
    city: requiredText("City", 100),
    submarket: optionalText(100),
    propertyType: z.enum(PropertyType, "Choose a property type."),
    totalAreaSqm: z.coerce.number("Total area is required.").int("Use whole square metres.").positive("Total area must be greater than zero."),
    minDivisibleAreaSqm: optionalArea,
    askingRentEurSqmMonth: optionalRent,
    availableFrom: optionalDate,
    features: commaList,
    description: optionalText(),
    status: z.enum(PropertyStatus, "Choose a status."),
  })
  .refine((p) => p.minDivisibleAreaSqm == null || p.minDivisibleAreaSqm <= p.totalAreaSqm, {
    path: ["minDivisibleAreaSqm"],
    message: "Cannot be larger than the total area.",
  });

export const companySchema = z
  .object({
    name: requiredText("Name"),
    industry: requiredText("Industry", 100),
    description: optionalText(),
    website: optionalUrl,
    currentCity: optionalText(100),
    headcount: z.preprocess(blankToNull, z.coerce.number("Enter a number.").int("Use a whole number.").positive("Must be greater than zero.").nullable()),
    currentAreaSqm: optionalArea,
    requiredAreaMinSqm: optionalArea,
    requiredAreaMaxSqm: optionalArea,
    preferredCities: commaList,
    preferredSubmarkets: commaList,
    preferredPropertyTypes: z.array(z.enum(PropertyType)),
    maxRentEurSqmMonth: optionalRent,
    targetMoveDate: optionalDate,
  })
  .refine(
    (c) => c.requiredAreaMinSqm == null || c.requiredAreaMaxSqm == null || c.requiredAreaMinSqm <= c.requiredAreaMaxSqm,
    { path: ["requiredAreaMaxSqm"], message: "Maximum must be at least the minimum." },
  );

export const signalSchema = z.object({
  type: z.enum(SignalType, "Choose a signal type."),
  title: requiredText("Title"),
  summary: optionalText(),
  sourceUrl: z.preprocess(trimmed, z.url({ message: "Enter the full source URL starting with https://", protocol: /^https?$/ })),
  sourceName: optionalText(100),
  observedAt: requiredDate("Date observed"),
  strength: z.enum(SignalStrength, "Choose a strength."),
});

export const leadUpdateSchema = z.object({
  status: z.enum(LeadStatus, "Choose a status."),
  followUpDate: optionalDate,
  ownerName: optionalText(100),
});

export const noteSchema = z.object({
  body: requiredText("Note", 5000),
});

// Shape returned by every form action, consumed by useActionState.
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string | string[]>;
};

// Reads a FormData into a plain object; repeated keys (checkboxes) become arrays.
export function formDataToObject(formData: FormData, arrayKeys: string[] = []) {
  const result: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    result[key] = arrayKeys.includes(key) ? all : (all[0] ?? "");
  }
  for (const key of arrayKeys) result[key] ??= [];
  return result;
}

export function validationFailure(error: z.ZodError, values: FormState["values"]): FormState {
  return {
    ok: false,
    message: "Please correct the highlighted fields.",
    errors: z.flattenError(error).fieldErrors as FormState["errors"],
    values,
  };
}
