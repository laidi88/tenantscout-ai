// Demo mode: when no DATABASE_URL is configured, the app serves the fictional
// demo data from memory instead of connecting to PostgreSQL. Setting
// DATABASE_URL switches back to the real database with no other changes.
export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL;
}
