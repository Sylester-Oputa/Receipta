import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { env } from "../config/env";

const seed = async () => {
  let business = await prisma.business.findFirst({ where: { businessCode: env.seed.businessCode } });
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: env.seed.businessName,
        businessCode: env.seed.businessCode,
        brandingPrimaryColor: env.seed.brandColor,
        allowOverpay: false
      }
    });
  }

  const existingOwner = await prisma.user.findFirst({
    where: { businessId: business.id, email: env.seed.ownerEmail }
  });

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash(env.seed.ownerPassword, 10);
    await prisma.user.create({
      data: {
        businessId: business.id,
        email: env.seed.ownerEmail,
        passwordHash,
        role: "OWNER",
        isActive: true
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed completed");
};

seed()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
