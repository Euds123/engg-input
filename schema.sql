-- PostgreSQL / Neon: create table for Component Details
-- Run this in the Neon SQL Editor (or psql) against your database before using the app.

CREATE TABLE IF NOT EXISTS "ComponentDetails" (
    "Id" SERIAL PRIMARY KEY,
    "DrawingId" VARCHAR(100),
    "LineId" VARCHAR(100),
    "RevNo" VARCHAR(50),
    "SpoolNo" VARCHAR(100),
    "Item" VARCHAR(100),
    "ItemCode" VARCHAR(100),
    "Description" TEXT,
    "Size_Inch" NUMERIC(18, 4),
    "MFA" VARCHAR(100),
    "SMIV" VARCHAR(100),
    "HMIV" VARCHAR(100),
    "SubContractor" VARCHAR(100),
    "IsMIVLinesIssuance" BOOLEAN,
    "ComponentStatus" VARCHAR(100),
    "InsuType" VARCHAR(100),
    "InsuThickness" NUMERIC(18, 2),
    "InsuLength" NUMERIC(18, 2),
    "RussianDescription" TEXT,
    "Specification" VARCHAR(100),
    "Length_InchMeter" NUMERIC(18, 4),
    "ComponentWeight" NUMERIC(18, 4),
    "ComponentSurfaceArea" NUMERIC(18, 4),
    "PaintSystem" VARCHAR(100),
    "UniqueComponentIdentifier" VARCHAR(100),
    "ErectionDrawingNo" VARCHAR(100),
    "UId" UUID DEFAULT gen_random_uuid(),
    "Quantity" NUMERIC(18, 4),
    "Length" NUMERIC(18, 4),
    "Part_No" VARCHAR(100),
    "Description_Language" VARCHAR(100),
    "SheetNo" VARCHAR(50),
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_DrawingId" ON "ComponentDetails" ("DrawingId");
CREATE INDEX IF NOT EXISTS "IX_LineId" ON "ComponentDetails" ("LineId");
