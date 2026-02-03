import { prisma } from "../db/prisma";

export const logAuditEvent = async (input: {
  businessId: string;
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  type: string;
  metaJson?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) => {
  await prisma.auditEvent.create({
    data: {
      businessId: input.businessId,
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      type: input.type,
      metaJson: input.metaJson ?? undefined,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined
    }
  });
};
