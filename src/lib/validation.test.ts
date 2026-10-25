import { describe, expect, it } from "vitest";
import { companySchema, formDataToObject, propertySchema, signalSchema } from "./validation";

const form = (entries: [string, string][]) => {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
};

describe("propertySchema", () => {
  const valid = {
    name: "Harbour Point",
    addressLine: "12 Quay Street",
    city: "Lindenfeld",
    submarket: "",
    propertyType: "OFFICE",
    totalAreaSqm: "1500",
    minDivisibleAreaSqm: "",
    askingRentEurSqmMonth: "22.50",
    availableFrom: "",
    features: "Parking, Fitted out, Parking",
    description: "",
    status: "AVAILABLE",
  };

  it("parses form strings into typed values and treats blanks as empty", () => {
    const result = propertySchema.parse(valid);
    expect(result.totalAreaSqm).toBe(1500);
    expect(result.askingRentEurSqmMonth).toBe(22.5);
    expect(result.submarket).toBeNull();
    expect(result.minDivisibleAreaSqm).toBeNull();
    expect(result.availableFrom).toBeNull();
    expect(result.features).toEqual(["Parking", "Fitted out"]);
  });

  it("rejects a divisible unit larger than the total area", () => {
    const result = propertySchema.safeParse({ ...valid, minDivisibleAreaSqm: "2000" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["minDivisibleAreaSqm"]);
  });

  it("requires a name and a property type", () => {
    const result = propertySchema.safeParse({ ...valid, name: "  ", propertyType: "" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toContain("name");
    expect(paths).toContain("propertyType");
  });
});

describe("companySchema", () => {
  it("reads checkbox arrays and comma lists", () => {
    const values = formDataToObject(
      form([
        ["name", "Northwind Biologics"],
        ["industry", "Biotech"],
        ["preferredCities", "Lindenfeld, Elmbrook"],
        ["preferredPropertyTypes", "OFFICE"],
        ["preferredPropertyTypes", "LAB"],
        ["requiredAreaMinSqm", "900"],
        ["requiredAreaMaxSqm", "800"],
      ]),
      ["preferredPropertyTypes"],
    );
    expect(values.preferredPropertyTypes).toEqual(["OFFICE", "LAB"]);
    const result = companySchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["requiredAreaMaxSqm"]);

    const fixed = companySchema.parse({ ...values, requiredAreaMaxSqm: "1200" });
    expect(fixed.preferredCities).toEqual(["Lindenfeld", "Elmbrook"]);
    expect(fixed.preferredPropertyTypes).toEqual(["OFFICE", "LAB"]);
  });

  it("gives an empty list when no property type is ticked", () => {
    const values = formDataToObject(form([["name", "A"], ["industry", "B"]]), ["preferredPropertyTypes"]);
    expect(companySchema.parse(values).preferredPropertyTypes).toEqual([]);
  });
});

describe("signalSchema", () => {
  const valid = {
    type: "EXPANSION",
    title: "Opens second site",
    summary: "",
    sourceUrl: "https://example.com/news/1",
    sourceName: "",
    observedAt: "2026-09-15",
    strength: "HIGH",
  };

  it("accepts a signal with an https source", () => {
    const result = signalSchema.parse(valid);
    expect(result.observedAt.toISOString()).toBe("2026-09-15T00:00:00.000Z");
  });

  it("requires a valid http(s) source URL", () => {
    expect(signalSchema.safeParse({ ...valid, sourceUrl: "" }).success).toBe(false);
    expect(signalSchema.safeParse({ ...valid, sourceUrl: "example.com" }).success).toBe(false);
    expect(signalSchema.safeParse({ ...valid, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("requires the date observed", () => {
    expect(signalSchema.safeParse({ ...valid, observedAt: "" }).success).toBe(false);
  });
});
