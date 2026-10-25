// Helpers for reading list filters from the URL query string.

export type SearchParams = Record<string, string | string[] | undefined>;

export function stringParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

export function enumParam<T extends string>(sp: SearchParams, key: string, allowed: readonly T[]): T | undefined {
  const v = stringParam(sp, key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}
