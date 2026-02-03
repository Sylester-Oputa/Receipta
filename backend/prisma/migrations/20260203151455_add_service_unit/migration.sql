-- CreateEnum
CREATE TYPE "ServiceUnit" AS ENUM ('HOURS', 'MONTHS', 'SESSIONS', 'UNITS');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "serviceUnit" "ServiceUnit" NOT NULL DEFAULT 'UNITS';
