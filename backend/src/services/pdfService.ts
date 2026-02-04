import PDFDocument from "pdfkit";
import {
  Invoice,
  InvoiceItem,
  Business,
  Client,
  Receipt,
  Payment,
} from "@prisma/client";
import fs from "fs";
import http from "http";
import https from "https";
import { PassThrough } from "stream";

const formatMoney = (value: unknown) => {
  if (
    value &&
    typeof (value as { toFixed?: (n: number) => string }).toFixed === "function"
  ) {
    return (value as { toFixed: (n: number) => string }).toFixed(2);
  }
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return String(value ?? "0.00");
};

const getServiceLabels = (unit?: string) => {
  const normalized = unit ?? "HOURS";
  const unitLabels: Record<string, string> = {
    HOURS: "Hours",
    MONTHS: "Months",
    SESSIONS: "Sessions",
    UNITS: "Units"
  };
  const rateLabels: Record<string, string> = {
    HOURS: "Hourly Rate",
    MONTHS: "Monthly Rate",
    SESSIONS: "Session Rate",
    UNITS: "Rate"
  };

  return {
    qtyLabel: unitLabels[normalized] ?? "Units",
    unitLabel: rateLabels[normalized] ?? "Rate"
  };
};

const bufferFromDoc = (
  doc: InstanceType<typeof PDFDocument>,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

const fetchImageBuffer = async (url?: string | null): Promise<Buffer | null> => {
  if (!url) return null;

  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1];
    if (!base64) return null;
    try {
      return Buffer.from(base64, "base64");
    } catch {
      return null;
    }
  }

  if (!/^https?:\/\//i.test(url)) {
    return null;
  }

  return new Promise((resolve) => {
    const client = url.startsWith("https://") ? https : http;
    const request = client.get(url, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        response.resume();
        resolve(null);
        return;
      }

      const chunks: Buffer[] = [];
      response.on("data", (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      );
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });

    request.on("error", () => resolve(null));
    request.setTimeout(4000, () => {
      request.destroy();
      resolve(null);
    });
  });
};

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
  const serviceLabels = getServiceLabels(data.invoice.serviceUnit ?? "HOURS");
  const qtyLabel = data.invoice.invoiceType === "SERVICE" ? serviceLabels.qtyLabel : "Qty";
  const unitLabel = data.invoice.invoiceType === "SERVICE" ? serviceLabels.unitLabel : "Unit Price";

  doc.fontSize(18).text(data.business.name, { align: "left" });
  doc.fontSize(10).text(data.business.address ?? "", { align: "left" });
  doc.moveDown();

  doc
    .fontSize(16)
    .text(`Invoice ${data.invoice.invoiceNo}`, { align: "right" });
  doc.fontSize(10).text(`Status: ${data.invoice.status}`, { align: "right" });
  doc.text(
    `Issue Date: ${data.invoice.issueDate.toISOString().split("T")[0]}`,
    { align: "right" },
  );
  if (data.invoice.dueDate) {
    doc.text(`Due Date: ${data.invoice.dueDate.toISOString().split("T")[0]}`, {
      align: "right",
    });
  }
  if (data.invoice.invoiceType === "SERVICE" && data.invoice.servicePeriod) {
    doc.text(`Service Period: ${data.invoice.servicePeriod}`, {
      align: "right",
    });
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
      doc
        .fontSize(10)
        .text(
          `${item.description} | ${qtyLabel}: ${formatMoney(item.qty)} | ${unitLabel}: ${formatMoney(
            item.unitPrice,
          )} | Line: ${formatMoney(item.lineTotal)}`,
        );
    });

  doc.moveDown();
  doc
    .fontSize(10)
    .text(
      `Subtotal: ${formatMoney(data.invoice.subtotal)} ${data.invoice.currency}`,
    );
  doc.text(
    `Tax (${formatMoney(data.invoice.taxRate)}%): ${formatMoney(data.invoice.taxTotal)}`,
  );
  doc.text(
    `Total: ${formatMoney(data.invoice.total)} ${data.invoice.currency}`,
  );

  if (data.invoice.notes) {
    doc.moveDown();
    doc.fontSize(10).text("Notes:");
    doc.text(data.invoice.notes);
  }

  if (data.signaturePath) {
    doc.moveDown();
    doc.fontSize(12).text("Signed By", { underline: true });
    doc
      .fontSize(10)
      .text(`${data.signerName ?? ""} (${data.signerEmail ?? ""})`);
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
  payment?: Payment | null;
  client?: Client | null;
}): Promise<Buffer> => {
  const logoBuffer = await fetchImageBuffer(data.business.logoUrl);
  const brandColor = data.business.brandingPrimaryColor;
  const safeBrandColor =
    typeof brandColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(brandColor)
      ? brandColor
      : "#111111";

  const drawReceipt = (doc: InstanceType<typeof PDFDocument>) => {
    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.font("Courier");
    doc.lineGap(-0.6);
    const charWidth = doc.widthOfString("0");
    const charsPerLine = Math.max(24, Math.floor(contentWidth / charWidth));
    const labelWidth = 11;

    const divider = (char = "-") => {
      doc.text(char.repeat(charsPerLine), { align: "center" });
    };

    const wrapText = (value: string, width: number) => {
      const words = value.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      words.forEach((word) => {
        if (!line) {
          line = word;
          return;
        }
        if (`${line} ${word}`.length <= width) {
          line = `${line} ${word}`;
        } else {
          lines.push(line);
          line = word;
        }
      });
      if (line) lines.push(line);
      return lines.length ? lines : [value];
    };

    const writeKV = (label: string, value: string, alignRight = false) => {
      const valueWidth = Math.max(8, charsPerLine - labelWidth);
      const lines = wrapText(value, valueWidth);
      lines.forEach((line, index) => {
        if (index === 0) {
          if (alignRight) {
            const spaces = Math.max(1, valueWidth - line.length);
            doc.text(`${label.padEnd(labelWidth)}${" ".repeat(spaces)}${line}`);
          } else {
            doc.text(`${label.padEnd(labelWidth)}${line}`);
          }
        } else {
          doc.text(`${" ".repeat(labelWidth)}${line}`);
        }
      });
    };

    const formatCurrency = (value: unknown) =>
      `${data.invoice.currency} ${formatMoney(value)}`;

    const formatDateTime = (date: Date) =>
      date.toISOString().replace("T", " ").split(".")[0];

    if (logoBuffer) {
      try {
        const maxWidth = Math.min(120, contentWidth);
        const maxHeight = 40;
        const y = doc.y;
        let width = maxWidth;
        let height = maxHeight;
        try {
          const image = (doc as unknown as {
            openImage?: (input: Buffer) => { width: number; height: number };
          }).openImage?.(logoBuffer);
          if (image?.width && image?.height) {
            const scale = Math.min(
              maxWidth / image.width,
              maxHeight / image.height,
              1,
            );
            width = image.width * scale;
            height = image.height * scale;
          }
        } catch {
          // Ignore measurement failures
        }
        const x = doc.page.margins.left + (contentWidth - width) / 2;
        doc.image(logoBuffer, x, y, { width, height });
        doc.y = y + height + 4;
      } catch {
        // Ignore logo render failures
      }
    }

    doc
      .font("Courier-Bold")
      .fontSize(11)
      .text(data.business.name.toUpperCase(), { align: "center" });
    doc.font("Courier").fontSize(8.5);
    if (data.business.address) {
      doc.text(data.business.address, { align: "center", width: contentWidth });
    }
    if (data.business.phone) {
      doc.text(data.business.phone, { align: "center" });
    }
    if (data.business.email) {
      doc.text(data.business.email, { align: "center" });
    }

    const barHeight = 8;
    doc.save();
    doc
      .fillColor(safeBrandColor)
      .rect(doc.page.margins.left, doc.y, contentWidth, barHeight)
      .fill();
    doc.restore();
    doc.y += barHeight + 2;

    divider("=");
    doc
      .font("Courier-Bold")
      .fontSize(9.5)
      .fillColor(safeBrandColor)
      .text("RECEIPT", { align: "center" })
      .fillColor("#000000");
    divider("=");

    doc.font("Courier").fontSize(8.5);
    writeKV("Receipt#", data.receipt.receiptNo);
    writeKV("Date", formatDateTime(data.receipt.createdAt));
    writeKV("Invoice#", data.invoice.invoiceNo);

    if (data.client?.name) {
      writeKV("Client", data.client.name);
    }

    divider();

    writeKV("Amount", formatCurrency(data.receipt.amount), true);
    writeKV("Balance", formatCurrency(data.receipt.balanceAfter), true);
    writeKV("Total", formatCurrency(data.invoice.total), true);

    if (data.payment?.method) {
      writeKV("Method", String(data.payment.method), true);
    }

    if (data.payment?.note) {
      doc.moveDown(0.1);
      doc.text("Note:");
      doc.text(data.payment.note);
    }

    divider();
    doc.text("Thank you for your business.", { align: "center" });
    doc.text("This receipt is powered by Receipta.", { align: "center" });

    return doc.y;
  };

  const measureDoc = new PDFDocument({
    size: [226, 2000],
    margin: 10,
  });
  measureDoc.pipe(new PassThrough());
  const measuredY = drawReceipt(measureDoc);
  const padding = Math.ceil(measureDoc.currentLineHeight(true)) + 4;
  measureDoc.end();

  const finalHeight = Math.max(measuredY + padding, 120);
  const doc = new PDFDocument({
    size: [226, finalHeight],
    margin: 10,
  });
  drawReceipt(doc);
  return bufferFromDoc(doc);
};
