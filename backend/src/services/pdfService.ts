import PDFDocument from "pdfkit";
import { Invoice, InvoiceItem, Business, Client, Receipt } from "@prisma/client";
import fs from "fs";

const formatMoney = (value: unknown) => {
  if (value && typeof (value as { toFixed?: (n: number) => string }).toFixed === "function") {
    return (value as { toFixed: (n: number) => string }).toFixed(2);
  }
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return String(value ?? "0.00");
};

const bufferFromDoc = (doc: PDFDocument): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

export const renderInvoicePdf = async (data: {
  business: Business;
  client: Client;
  invoice: Invoice;
  items: InvoiceItem[];
  signaturePath?: string;
  signerName?: string;
  signerEmail?: string;
  signedAt?: Date | null;
}): Promise<Buffer> => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.fontSize(18).text(data.business.name, { align: "left" });
  doc.fontSize(10).text(data.business.address ?? "", { align: "left" });
  doc.moveDown();

  doc.fontSize(16).text(`Invoice ${data.invoice.invoiceNo}`, { align: "right" });
  doc.fontSize(10).text(`Status: ${data.invoice.status}`, { align: "right" });
  doc.text(`Issue Date: ${data.invoice.issueDate.toISOString().split("T")[0]}`, { align: "right" });
  if (data.invoice.dueDate) {
    doc.text(`Due Date: ${data.invoice.dueDate.toISOString().split("T")[0]}`, { align: "right" });
  }

  doc.moveDown();
  doc.fontSize(12).text(`Bill To: ${data.client.name}`);
  if (data.client.contactName) doc.text(data.client.contactName);
  if (data.client.email) doc.text(data.client.email);
  if (data.client.phone) doc.text(data.client.phone);
  if (data.client.address) doc.text(data.client.address);

  doc.moveDown();
  doc.fontSize(12).text("Items", { underline: true });
  doc.moveDown(0.5);

  data.items
    .sort((a, b) => a.position - b.position)
    .forEach((item) => {
      doc.fontSize(10).text(
        `${item.description} | Qty: ${formatMoney(item.qty)} | Unit: ${formatMoney(
          item.unitPrice
        )} | Line: ${formatMoney(item.lineTotal)}`
      );
    });

  doc.moveDown();
  doc.fontSize(10).text(`Subtotal: ${formatMoney(data.invoice.subtotal)} ${data.invoice.currency}`);
  doc.text(`Tax (${formatMoney(data.invoice.taxRate)}%): ${formatMoney(data.invoice.taxTotal)}`);
  doc.text(`Total: ${formatMoney(data.invoice.total)} ${data.invoice.currency}`);

  if (data.invoice.notes) {
    doc.moveDown();
    doc.fontSize(10).text("Notes:");
    doc.text(data.invoice.notes);
  }

  if (data.signaturePath) {
    doc.moveDown();
    doc.fontSize(12).text("Signed By", { underline: true });
    doc.fontSize(10).text(`${data.signerName ?? ""} (${data.signerEmail ?? ""})`);
    if (data.signedAt) {
      doc.text(`Signed At: ${data.signedAt.toISOString()}`);
    }
    if (fs.existsSync(data.signaturePath)) {
      doc.image(data.signaturePath, { width: 200, height: 80 });
    }
  }

  return bufferFromDoc(doc);
};

export const renderReceiptPdf = async (data: {
  business: Business;
  invoice: Invoice;
  receipt: Receipt;
}): Promise<Buffer> => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.fontSize(18).text(data.business.name, { align: "left" });
  doc.moveDown();
  doc.fontSize(16).text(`Receipt ${data.receipt.receiptNo}`, { align: "right" });
  doc.fontSize(10).text(`Invoice: ${data.invoice.invoiceNo}`, { align: "right" });

  doc.moveDown();
  doc.fontSize(12).text(`Amount: ${formatMoney(data.receipt.amount)} ${data.invoice.currency}`);
  doc.text(`Balance After: ${formatMoney(data.receipt.balanceAfter)} ${data.invoice.currency}`);
  doc.text(`Issued: ${data.receipt.createdAt.toISOString()}`);

  return bufferFromDoc(doc);
};
