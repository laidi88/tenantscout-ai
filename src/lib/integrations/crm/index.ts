// Extension point for syncing companies and leads with an external CRM.
// No CRM is connected today. Companies and leads already have externalId,
// externalSource and lastSyncedAt columns for a future adapter to fill in.
// See docs/integrations.md.

export type CrmCompany = {
  id: string;
  name: string;
  industry: string;
  website: string | null;
  externalId: string | null;
};

export type CrmLead = {
  id: string;
  status: string;
  score: number;
  followUpDate: Date | null;
  ownerName: string | null;
  company: CrmCompany;
  property: { id: string; name: string; city: string };
  externalId: string | null;
};

export type CrmSyncResult =
  | { ok: true; externalId: string; externalSource: string }
  | { ok: false; reason: string };

export interface CrmAdapter {
  id: string;
  label: string;
  isConfigured(): boolean;
  syncCompany(company: CrmCompany): Promise<CrmSyncResult>;
  pushLead(lead: CrmLead): Promise<CrmSyncResult>;
}

const notConfigured: CrmAdapter = {
  id: "none",
  label: "No CRM connected",
  isConfigured: () => false,
  syncCompany: async () => ({ ok: false, reason: "No CRM is connected." }),
  pushLead: async () => ({ ok: false, reason: "No CRM is connected." }),
};

// Replace with a real adapter (for example chosen by an environment variable)
// once a CRM integration is built.
export function getCrmAdapter(): CrmAdapter {
  return notConfigured;
}
