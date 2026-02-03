-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PRODUCT', 'SERVICE');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceType" "InvoiceType" NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN     "servicePeriod" TEXT;
