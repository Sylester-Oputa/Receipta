export type ServiceUnit = "HOURS" | "MONTHS" | "SESSIONS" | "UNITS";

const unitLabels: Record<ServiceUnit, string> = {
  HOURS: "Hours",
  MONTHS: "Months",
  SESSIONS: "Sessions",
  UNITS: "Units",
};

const rateLabels: Record<ServiceUnit, string> = {
  HOURS: "Hourly Rate",
  MONTHS: "Monthly Rate",
  SESSIONS: "Session Rate",
  UNITS: "Rate",
};

export const getServiceLabels = (unit?: ServiceUnit) => {
  const normalized = unit ?? "HOURS";
  return {
    qtyLabel: unitLabels[normalized],
    unitLabel: rateLabels[normalized],
  };
};
