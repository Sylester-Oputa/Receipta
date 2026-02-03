import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/receipta_test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require("../src/db/prisma");

const resetDb = async () => {
  await prisma.invoiceSignature.deleteMany();
  await prisma.invoiceLink.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sequence.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.business.deleteMany();
};

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
