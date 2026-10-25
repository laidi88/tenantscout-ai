-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('OFFICE', 'RETAIL', 'INDUSTRIAL', 'LOGISTICS', 'LAB', 'MIXED_USE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'UNDER_OFFER', 'LET', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('EXPANSION', 'RELOCATION', 'FUNDING', 'HIRING', 'LEASE_EXPIRY', 'NEW_OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "SignalStrength" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SignalOrigin" AS ENUM ('MANUAL', 'IMPORT', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'NEGOTIATION', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "submarket" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "totalAreaSqm" INTEGER NOT NULL,
    "minDivisibleAreaSqm" INTEGER,
    "askingRentEurSqmMonth" DECIMAL(8,2),
    "availableFrom" TIMESTAMP(3),
    "features" TEXT[],
    "description" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "currentCity" TEXT,
    "headcount" INTEGER,
    "currentAreaSqm" INTEGER,
    "requiredAreaMinSqm" INTEGER,
    "requiredAreaMaxSqm" INTEGER,
    "preferredCities" TEXT[],
    "preferredSubmarkets" TEXT[],
    "preferredPropertyTypes" "PropertyType"[],
    "maxRentEurSqmMonth" DECIMAL(8,2),
    "targetMoveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "TenantCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "strength" "SignalStrength" NOT NULL DEFAULT 'MEDIUM',
    "origin" "SignalOrigin" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "scoredAt" TIMESTAMP(3) NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "followUpDate" TIMESTAMP(3),
    "ownerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCompany_externalSource_externalId_key" ON "TenantCompany"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "Signal_companyId_idx" ON "Signal"("companyId");

-- CreateIndex
CREATE INDEX "Signal_observedAt_idx" ON "Signal"("observedAt");

-- CreateIndex
CREATE INDEX "Lead_score_idx" ON "Lead"("score");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_followUpDate_idx" ON "Lead"("followUpDate");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_companyId_propertyId_key" ON "Lead"("companyId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_externalSource_externalId_key" ON "Lead"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "Note_leadId_idx" ON "Note"("leadId");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TenantCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TenantCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
