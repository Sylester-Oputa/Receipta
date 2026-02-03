import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import { createBusinessAndOwner, createClient } from "./helpers";
import { hashSha256 } from "../src/utils/crypto";

const app = createApp();

const SIGNATURE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

describe("Receipta core rules", () => {
  test("Invoice editable only in DRAFT and locks after SEND", async () => {
    const { business, token } = await createBusinessAndOwner();
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Design", qty: 1, unitPrice: 100 }]
      });

    expect(createRes.status).toBe(201);

    const invoiceId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Design", qty: 2, unitPrice: 100 }]
      });

    expect(updateRes.status).toBe(200);

    const sendRes = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/send`)
      .set("Authorization", `Bearer ${token}`);

    expect(sendRes.status).toBe(200);

    const lockedRes = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Design", qty: 3, unitPrice: 100 }]
      });

    expect(lockedRes.status).toBe(409);
  });

  test("Signing locks invoice permanently and prevents second signature", async () => {
    const { business, token } = await createBusinessAndOwner();
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Dev", qty: 1, unitPrice: 100 }]
      });

    const sendRes = await request(app)
      .post(`/api/v1/invoices/${createRes.body.id}/send`)
      .set("Authorization", `Bearer ${token}`);

    const signToken = sendRes.body.tokens.signToken;

    const signRes = await request(app)
      .post(`/api/v1/public/invoices/sign/${signToken}`)
      .send({
        signerName: "Jane Doe",
        signerEmail: "jane@example.com",
        acknowledge: true,
        signatureDataUrl: SIGNATURE_DATA_URL
      });

    expect(signRes.status).toBe(200);

    const secondSign = await request(app)
      .post(`/api/v1/public/invoices/sign/${signToken}`)
      .send({
        signerName: "Jane Doe",
        signerEmail: "jane@example.com",
        acknowledge: true,
        signatureDataUrl: SIGNATURE_DATA_URL
      });

    expect(secondSign.status).toBe(409);

    const lockedRes = await request(app)
      .patch(`/api/v1/invoices/${createRes.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Dev", qty: 2, unitPrice: 100 }]
      });

    expect(lockedRes.status).toBe(409);
  });

  test("Brand color snapshot stored on invoice creation", async () => {
    const { business, token } = await createBusinessAndOwner({ brandingPrimaryColor: "#AA1122" });
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Design", qty: 1, unitPrice: 100 }]
      });

    expect(createRes.body.brandColor).toBe("#AA1122");

    await prisma.business.update({
      where: { id: business.id },
      data: { brandingPrimaryColor: "#00FF00" }
    });

    const invoice = await prisma.invoice.findFirst({ where: { id: createRes.body.id } });
    expect(invoice?.brandColor).toBe("#AA1122");
  });

  test("Partial payment updates status", async () => {
    const { business, token } = await createBusinessAndOwner();
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Dev", qty: 1, unitPrice: 100 }]
      });

    const paymentRes = await request(app)
      .post(`/api/v1/invoices/${createRes.body.id}/payments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 40, method: "CARD" });

    expect(paymentRes.status).toBe(201);

    const invoice = await prisma.invoice.findFirst({ where: { id: createRes.body.id } });
    expect(invoice?.status).toBe("PART_PAID");
  });

  test("Overpayment rejected", async () => {
    const { business, token } = await createBusinessAndOwner();
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Dev", qty: 1, unitPrice: 100 }]
      });

    const paymentRes = await request(app)
      .post(`/api/v1/invoices/${createRes.body.id}/payments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 200, method: "CARD" });

    expect(paymentRes.status).toBe(400);
  });

  test("Receipt created per payment", async () => {
    const { business, token } = await createBusinessAndOwner();
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Dev", qty: 1, unitPrice: 100 }]
      });

    const paymentRes = await request(app)
      .post(`/api/v1/invoices/${createRes.body.id}/payments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50, method: "CARD" });

    expect(paymentRes.status).toBe(201);

    const receipt = await prisma.receipt.findFirst({
      where: { paymentId: paymentRes.body.payment.id }
    });

    expect(receipt).toBeTruthy();
  });

  test("Token hashing lookup works", async () => {
    const { business, token } = await createBusinessAndOwner();
    const client = await createClient(business.id);

    const createRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.id,
        currency: "USD",
        taxRate: 0,
        items: [{ description: "Dev", qty: 1, unitPrice: 100 }]
      });

    const sendRes = await request(app)
      .post(`/api/v1/invoices/${createRes.body.id}/send`)
      .set("Authorization", `Bearer ${token}`);

    const viewToken = sendRes.body.tokens.viewToken;

    const publicRes = await request(app).get(`/api/v1/public/invoices/view/${viewToken}`);
    expect(publicRes.status).toBe(200);

    const link = await prisma.invoiceLink.findFirst({
      where: { invoiceId: createRes.body.id, type: "VIEW" }
    });

    expect(link?.tokenHash).toBe(hashSha256(viewToken));
    expect(link?.tokenHash).not.toBe(viewToken);
  });
});
