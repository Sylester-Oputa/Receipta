import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { logAuditEvent } from "../services/auditService";

export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const client = await prisma.client.create({
      data: {
        businessId,
        name: req.body.name,
        contactName: req.body.contactName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address
      }
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Client",
      entityId: client.id,
      type: "CLIENT_CREATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.status(201).json(client);
  } catch (error) {
    return next(error);
  }
};

export const listClients = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const includeArchived = req.query.includeArchived === "true";

  const clients = await prisma.client.findMany({
    where: {
      businessId,
      ...(includeArchived ? {} : { archivedAt: null })
    },
    orderBy: { name: "asc" }
  });

  return res.json(clients);
};

export const getClient = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const client = await prisma.client.findFirst({
    where: { id: req.params.id, businessId }
  });

  if (!client) {
    throw new AppError(404, "Client not found", "NOT_FOUND");
  }

  return res.json(client);
};

export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, businessId }
    });
    if (!existing) {
      throw new AppError(404, "Client not found", "NOT_FOUND");
    }

    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        name: req.body.name,
        contactName: req.body.contactName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address
      }
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Client",
      entityId: client.id,
      type: "CLIENT_UPDATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json(client);
  } catch (error) {
    return next(error);
  }
};

export const archiveClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, businessId }
    });
    if (!existing) {
      throw new AppError(404, "Client not found", "NOT_FOUND");
    }

    const client = await prisma.client.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() }
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Client",
      entityId: client.id,
      type: "CLIENT_ARCHIVED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json(client);
  } catch (error) {
    return next(error);
  }
};
