import { Prisma } from "@prisma/client";

export type InvoiceItemInput = {
  description: string;
  qty: number;
  unitPrice: number;
  position: number;
};

export const calculateTotals = (items: InvoiceItemInput[], taxRatePercent: number) => {
  const preparedItems = items.map((item) => {
    const qty = new Prisma.Decimal(item.qty);
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const lineTotal = qty.mul(unitPrice).toDecimalPlaces(2);
    return {
      ...item,
      qty,
      unitPrice,
      lineTotal
    };
  });

  const subtotal = preparedItems
    .reduce((acc, item) => acc.plus(item.lineTotal), new Prisma.Decimal(0))
    .toDecimalPlaces(2);

  const taxRate = new Prisma.Decimal(taxRatePercent).div(100);
  const taxTotal = subtotal.mul(taxRate).toDecimalPlaces(2);
  const total = subtotal.plus(taxTotal).toDecimalPlaces(2);

  return {
    items: preparedItems,
    subtotal,
    taxTotal,
    total
  };
};
