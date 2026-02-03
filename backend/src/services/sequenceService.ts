import { Prisma, SequenceKey } from "@prisma/client";
import { prisma } from "../db/prisma";

const padNumber = (value: number) => value.toString().padStart(4, "0");

export const formatInvoiceNo = (businessCode: string, year: number, seq: number) =>
  `${businessCode}-INV-${year}-${padNumber(seq)}`;

export const formatReceiptNo = (businessCode: string, year: number, seq: number) =>
  `${businessCode}-RCT-${year}-${padNumber(seq)}`;

const getNextSequenceInternal = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  key: SequenceKey,
  year: number
): Promise<number> => {
  const existing = await tx.$queryRaw<{ id: string; lastNumber: number }[]>`
    SELECT "id", "lastNumber" FROM "Sequence"
    WHERE "businessId" = ${businessId} AND "key" = ${key} AND "year" = ${year}
    FOR UPDATE
  `;

  if (existing.length === 0) {
    const created = await tx.sequence.create({
      data: {
        businessId,
        key,
        year,
        lastNumber: 1
      }
    });
    return created.lastNumber;
  }

  const next = existing[0].lastNumber + 1;
  await tx.sequence.update({
    where: { id: existing[0].id },
    data: { lastNumber: next }
  });
  return next;
};

export const getNextSequence = async (
  businessId: string,
  key: SequenceKey,
  year: number
): Promise<number> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction((tx) => getNextSequenceInternal(tx, businessId, key, year));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unable to generate next sequence number");
};

export const getNextSequenceWithTx = (
  tx: Prisma.TransactionClient,
  businessId: string,
  key: SequenceKey,
  year: number
): Promise<number> => getNextSequenceInternal(tx, businessId, key, year);
