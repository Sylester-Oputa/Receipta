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
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const serviceLabels = getServiceLabels(data.invoice.serviceUnit ?? "HOURS");
  const qtyLabel =
    data.invoice.invoiceType === "SERVICE" ? serviceLabels.qtyLabel : "Qty";
  const unitLabel =
    data.invoice.invoiceType === "SERVICE"
      ? serviceLabels.unitLabel
      : "Unit Price";

  const logoBuffer = await fetchImageBuffer(data.business.logoUrl);
  const brandColor = data.invoice.brandColor || data.business.brandingPrimaryColor;
  const safeBrandColor =
    typeof brandColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(brandColor)
      ? brandColor
      : "#0F172A";

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin - doc.page.margins.right;
  const rightColumnWidth = 200;
  const gap = 20;
  const leftColumnWidth = contentWidth - rightColumnWidth - gap;
  const leftX = margin;
  const rightX = margin + leftColumnWidth + gap;

  const formatDate = (value?: Date | null) =>
    value ? value.toISOString().split("T")[0] : "";

  const formatCurrency = (value: unknown) =>
    `${data.invoice.currency} ${formatMoney(value)}`;

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: {
      width: number;
      size: number;
      align?: "left" | "right" | "center";
      bold?: boolean;
      color?: string;
    },
  ) => {
    doc.font(options.bold ? "Helvetica-Bold" : "Helvetica");
    doc.fontSize(options.size);
    if (options.color) {
      doc.fillColor(options.color);
    } else {
      doc.fillColor("#111111");
    }
    doc.text(text, x, y, { width: options.width, align: options.align });
    doc.fillColor("#111111");
    return y + doc.heightOfString(text, { width: options.width, align: options.align });
  };

  const drawKeyValue = (
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ) => {
    const labelY = drawText(label.toUpperCase(), x, y, {
      width,
      size: 8,
      align: "right",
      color: "#6B7280",
    });
    return drawText(value, x, labelY - 2, {
      width,
      size: 10,
      align: "right",
      bold: true,
    });
  };

  // Top accent bar
  doc.save();
  doc
    .fillColor(safeBrandColor)
    .rect(margin, margin - 18, contentWidth, 6)
    .fill();
  doc.restore();

  let leftY = margin;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, leftX, leftY, { fit: [100, 50] });
      leftY += 56;
    } catch {
      // Ignore logo render failures
    }
  }

  leftY = drawText(data.business.name, leftX, leftY, {
    width: leftColumnWidth,
    size: 16,
    bold: true,
  });
  if (data.business.address) {
    leftY = drawText(data.business.address, leftX, leftY + 2, {
      width: leftColumnWidth,
      size: 9,
      color: "#4B5563",
    });
  }
  const contactLines = [
    data.business.phone,
    data.business.email,
  ].filter(Boolean) as string[];
  if (contactLines.length > 0) {
    leftY = drawText(contactLines.join(" | "), leftX, leftY + 2, {
      width: leftColumnWidth,
      size: 9,
      color: "#4B5563",
    });
  }

  let rightY = margin;
  rightY = drawText("INVOICE", rightX, rightY, {
    width: rightColumnWidth,
    size: 18,
    align: "right",
    bold: true,
    color: safeBrandColor,
  });
  rightY = drawKeyValue("Invoice No", data.invoice.invoiceNo, rightX, rightY + 4, rightColumnWidth);
  rightY = drawKeyValue("Status", data.invoice.status, rightX, rightY + 4, rightColumnWidth);
  rightY = drawKeyValue("Issue Date", formatDate(data.invoice.issueDate), rightX, rightY + 4, rightColumnWidth);
  if (data.invoice.dueDate) {
    rightY = drawKeyValue("Due Date", formatDate(data.invoice.dueDate), rightX, rightY + 4, rightColumnWidth);
  }
  if (data.invoice.invoiceType === "SERVICE" && data.invoice.servicePeriod) {
    rightY = drawKeyValue("Service Period", data.invoice.servicePeriod, rightX, rightY + 4, rightColumnWidth);
  }

  const headerBottom = Math.max(leftY, rightY) + 16;
  doc.moveTo(margin, headerBottom).lineTo(pageWidth - margin, headerBottom).strokeColor("#E5E7EB").stroke();

  // Bill To and Details
  const sectionY = headerBottom + 12;
  let billToY = drawText("Bill To", leftX, sectionY, {
    width: leftColumnWidth,
    size: 10,
    bold: true,
    color: safeBrandColor,
  });
  billToY = drawText(data.client.name, leftX, billToY + 2, {
    width: leftColumnWidth,
    size: 11,
    bold: true,
  });
  const clientLines = [
    data.client.contactName,
    data.client.email,
    data.client.phone,
    data.client.address,
  ].filter(Boolean) as string[];
  if (clientLines.length > 0) {
    billToY = drawText(clientLines.join("\n"), leftX, billToY + 2, {
      width: leftColumnWidth,
      size: 9,
      color: "#4B5563",
    });
  }

  let detailY = drawText("Details", rightX, sectionY, {
    width: rightColumnWidth,
    size: 10,
    bold: true,
    color: safeBrandColor,
    align: "right",
  });
  detailY = drawKeyValue("Currency", data.invoice.currency, rightX, detailY + 2, rightColumnWidth);
  detailY = drawKeyValue("Invoice Type", data.invoice.invoiceType, rightX, detailY + 2, rightColumnWidth);

  const tableStartY = Math.max(billToY, detailY) + 16;

  // Items table
  const tableX = margin;
  const tableWidth = contentWidth;
  const colDesc = Math.floor(tableWidth * 0.48);
  const colQty = Math.floor(tableWidth * 0.14);
  const colUnit = Math.floor(tableWidth * 0.18);
  const colTotal = tableWidth - colDesc - colQty - colUnit;

  const headerHeight = 18;
  doc.save();
  doc.fillColor(safeBrandColor).rect(tableX, tableStartY, tableWidth, headerHeight).fill();
  doc.restore();
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
  doc.text("Description", tableX + 6, tableStartY + 5, { width: colDesc - 8 });
  doc.text(qtyLabel, tableX + colDesc, tableStartY + 5, { width: colQty - 6, align: "right" });
  doc.text(unitLabel, tableX + colDesc + colQty, tableStartY + 5, { width: colUnit - 6, align: "right" });
  doc.text("Total", tableX + colDesc + colQty + colUnit, tableStartY + 5, { width: colTotal - 6, align: "right" });

  let rowY = tableStartY + headerHeight;
  doc.font("Helvetica").fontSize(9).fillColor("#111111");
  data.items
    .sort((a, b) => a.position - b.position)
    .forEach((item, index) => {
      const descHeight = doc.heightOfString(item.description, {
        width: colDesc - 8,
        align: "left",
      });
      const rowHeight = Math.max(16, descHeight + 6);
      if (index % 2 === 1) {
        doc.save();
        doc.fillColor("#F9FAFB").rect(tableX, rowY, tableWidth, rowHeight).fill();
        doc.restore();
      }
      doc.fillColor("#111111");
      doc.text(item.description, tableX + 6, rowY + 4, { width: colDesc - 8 });
      doc.text(formatMoney(item.qty), tableX + colDesc, rowY + 4, { width: colQty - 6, align: "right" });
      doc.text(formatMoney(item.unitPrice), tableX + colDesc + colQty, rowY + 4, { width: colUnit - 6, align: "right" });
      doc.text(formatMoney(item.lineTotal), tableX + colDesc + colQty + colUnit, rowY + 4, { width: colTotal - 6, align: "right" });
      doc.moveTo(tableX, rowY + rowHeight).lineTo(tableX + tableWidth, rowY + rowHeight).strokeColor("#E5E7EB").stroke();
      rowY += rowHeight;
    });

  // Totals
  const totalsWidth = 220;
  const totalsX = tableX + tableWidth - totalsWidth;
  let totalsY = rowY + 12;
  const drawAmountRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9).fillColor("#374151");
    doc.text(label, totalsX, totalsY, { width: totalsWidth - 80 });
    doc.text(value, totalsX, totalsY, { width: totalsWidth, align: "right" });
    totalsY += bold ? 16 : 14;
  };
  drawAmountRow("Subtotal", formatCurrency(data.invoice.subtotal));
  drawAmountRow(`Tax (${formatMoney(data.invoice.taxRate)}%)`, formatCurrency(data.invoice.taxTotal));
  doc.save();
  doc.fillColor(safeBrandColor).rect(totalsX, totalsY, totalsWidth, 20).fill();
  doc.restore();
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#FFFFFF");
  doc.text("Total", totalsX + 8, totalsY + 5, { width: totalsWidth - 16 });
  doc.text(formatCurrency(data.invoice.total), totalsX, totalsY + 5, { width: totalsWidth - 8, align: "right" });
  totalsY += 26;

  let sectionEndY = Math.max(totalsY, rowY + 10);

  // Notes and payment info
  const bankDetails = (data.business.bankDetailsJson ?? {}) as Record<string, any>;
  if (data.invoice.notes) {
    sectionEndY = drawText("Notes", leftX, sectionEndY + 10, {
      width: contentWidth,
      size: 10,
      bold: true,
      color: safeBrandColor,
    });
    sectionEndY = drawText(data.invoice.notes, leftX, sectionEndY + 4, {
      width: contentWidth,
      size: 9,
      color: "#374151",
    });
  }

  if (bankDetails.bankName || bankDetails.accountNumber) {
    sectionEndY = drawText("Payment Information", leftX, sectionEndY + 10, {
      width: contentWidth,
      size: 10,
      bold: true,
      color: safeBrandColor,
    });
    const bankLines = [
      bankDetails.bankName ? `Bank: ${bankDetails.bankName}` : null,
      bankDetails.accountName ? `Account Name: ${bankDetails.accountName}` : null,
      bankDetails.accountNumber ? `Account Number: ${bankDetails.accountNumber}` : null,
    ].filter(Boolean) as string[];
    sectionEndY = drawText(bankLines.join("\n"), leftX, sectionEndY + 4, {
      width: contentWidth,
      size: 9,
      color: "#374151",
    });
  }

  // Signature
  if (data.signaturePath) {
    sectionEndY = drawText("Acknowledgement Signature", leftX, sectionEndY + 12, {
      width: contentWidth,
      size: 10,
      bold: true,
      color: safeBrandColor,
    });
    if (data.signerName || data.signerEmail) {
      sectionEndY = drawText(
        `${data.signerName ?? ""}${data.signerEmail ? ` (${data.signerEmail})` : ""}`,
        leftX,
        sectionEndY + 4,
        { width: contentWidth, size: 9, color: "#374151" },
      );
    }
    if (data.signedAt) {
      sectionEndY = drawText(
        `Signed at: ${data.signedAt.toISOString()}`,
        leftX,
        sectionEndY + 2,
        { width: contentWidth, size: 9, color: "#374151" },
      );
    }
    if (fs.existsSync(data.signaturePath)) {
      doc.image(data.signaturePath, leftX, sectionEndY + 6, { width: 180, height: 70 });
      sectionEndY += 80;
    }
  }

  // Footer
  drawText("Thank you for your business.", leftX, sectionEndY + 16, {
    width: contentWidth,
    size: 9,
    align: "center",
    color: "#6B7280",
  });

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
