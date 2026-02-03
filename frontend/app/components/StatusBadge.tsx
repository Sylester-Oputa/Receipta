import { InvoiceStatus } from '@/app/contexts/AppContext';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-[var(--status-draft-bg)] text-[var(--status-draft)]' },
  SENT: { label: 'Sent', className: 'bg-[var(--status-sent-bg)] text-[var(--status-sent)]' },
  SIGNED: { label: 'Signed', className: 'bg-[var(--status-signed-bg)] text-[var(--status-signed)]' },
  PART_PAID: { label: 'Part Paid', className: 'bg-[var(--status-part-paid-bg)] text-[var(--status-part-paid)]' },
  PAID: { label: 'Paid', className: 'bg-[var(--status-paid-bg)] text-[var(--status-paid)]' },
  VOIDED: { label: 'Voided', className: 'bg-[var(--status-voided-bg)] text-[var(--status-voided)]' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
