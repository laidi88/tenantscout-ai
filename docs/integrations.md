# Adding integrations later

TenantScout AI currently has **no automated research and no CRM connection**. Signals are typed in by users, each with a public source URL, and the interface labels them "Recorded manually". The code has two extension points so these features can be added without reworking the data model.

## Automated company research

Code: `src/lib/integrations/research/`

A research provider implements `SignalProvider`:

- `fetchSignals(company)` returns **candidate** signals (type, title, summary, source URL, date, strength).
- `origin` is `IMPORT` (for example a CSV or bulk import) or `AUTOMATED` (a live data source), and is stored on every signal it creates.
- `isConfigured()` returns false until its credentials or data source are set up.

To add one:

1. Implement the provider in its own file in `src/lib/integrations/research/` and keep any API keys in Railway environment variables, never in code.
2. Add it to `PROVIDERS` in `index.ts`.
3. Add a server action that calls `fetchSignals`, lets a user review the candidates, and saves the accepted ones with the provider's `origin`.
4. Update interface wording that says signals are recorded manually. `hasAutomatedResearch()` is there to drive that wording.

Ground rules:

- Every signal needs a real, public source URL.
- Don't describe anything as "live monitoring" unless a working provider is configured and running.
- Respect each data source's terms of use, and don't store personal data about individuals.

## CRM integration

Code: `src/lib/integrations/crm/`

A CRM adapter implements `CrmAdapter`, with `syncCompany` and `pushLead`. Both return the record's ID in the CRM. Companies and leads already have these columns:

| Column | Purpose |
|---|---|
| `externalId` | The record's ID in the CRM |
| `externalSource` | Which CRM it came from, e.g. `"hubspot"` |
| `lastSyncedAt` | When it was last synced |

`(externalSource, externalId)` is unique, so the same CRM record can't be linked twice.

To add one:

1. Implement the adapter and return it from `getCrmAdapter()` when its environment variables are set.
2. Add a "Send to CRM" action on the lead page that calls `pushLead` and stores the returned IDs.
3. Optionally add a scheduled job to pull status changes back from the CRM.

## Scoring

Matching is rule-based and lives in `src/lib/scoring/`. Weights, thresholds and must-have criteria are in `config.ts`. If an AI model is ever used for scoring, keep the per-criterion breakdown and reasons so scores stay explainable.
