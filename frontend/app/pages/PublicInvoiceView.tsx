import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/app/components/StatusBadge';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { Button } from '@/app/components/ui/button';
import { Download, FileSignature } from 'lucide-react';
import { motion } from 'motion/react';
import { API_URL, publicApi } from '@/lib/api';
import { formatCurrency } from '@/app/utils/format';

type PublicInvoiceResponse = {
  id: string;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  notes?: string;
  subtotal: any;
  taxRate: any;
  taxTotal: any;
  total: any;
  brandColor: string;
  business: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    bankDetails?: {
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
    } | null;
  };
  client: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    id: string;
    description: string;
    qty: any;
    unitPrice: any;
    lineTotal: any;
  }>;
  signature?: {
    signerName: string;
    signerEmail: string;
    signedAt: string;
  } | null;
};

const toNumber = (value: any) => (value == null ? 0 : Number(value));

export function PublicInvoiceView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<PublicInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSign, setCanSign] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      try {
        const response = await publicApi.viewInvoice(token);
        setInvoice(response.data);
        setCanSign(false);
      } catch {
        try {
          const response = await publicApi.viewInvoiceForSign(token);
          setInvoice(response.data);
          setCanSign(true);
        } catch {
          setInvoice(null);
          setCanSign(false);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground">This invoice link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const brandColor = invoice.brandColor || '#0F172A';
  const isSigned = !!invoice.signature;
  const bankDetails = invoice.business.bankDetails ?? {};

  const handleDownloadPdf = () => {
    const signedParam = isSigned ? '?signed=true' : '';
    window.open(
      `${API_URL}/v1/public/invoices/pdf/${token}${signedParam}`,
      '_blank',
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {/* Header with Brand Color Accent */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="h-2" style={{ backgroundColor: brandColor }} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">From</div>
                  {invoice.business.logoUrl && (
                    <img
                      src={invoice.business.logoUrl}
                      alt={`${invoice.business.name} logo`}
                      className="h-10 mb-2 object-contain"
                    />
                  )}
                  <div className="font-semibold text-lg">{invoice.business.name}</div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {invoice.business.address}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <div>{invoice.business.phone}</div>
                    <div>{invoice.business.email}</div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-semibold mb-2">{invoice.invoiceNo}</div>
                  <StatusBadge status={invoice.status as any} />
                </div>
              </div>

              <div className="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Bill To</div>
                  <div className="font-medium">{invoice.client.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div>{invoice.client.address}</div>
                    <div className="mt-1">{invoice.client.email}</div>
                    <div>{invoice.client.phone}</div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Issue Date: </span>
                      <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                    </div>
                    {invoice.dueDate && (
                      <div>
                        <span className="text-muted-foreground">Due Date: </span>
                        <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: brandColor, color: 'white' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{toNumber(item.qty)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(toNumber(item.unitPrice))}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(toNumber(item.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-4 sm:p-6 space-y-2 bg-muted">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(toNumber(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({toNumber(invoice.taxRate)}%)</span>
                <span>{formatCurrency(toNumber(invoice.taxTotal))}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-border text-lg">
                <span>Total</span>
                <span>{formatCurrency(toNumber(invoice.total))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Bank Details */}
          {(bankDetails.bankName || bankDetails.accountNumber) && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3">Payment Information</h3>
              <div className="space-y-1 text-sm">
                {bankDetails.bankName && (
                  <div>
                    <span className="text-muted-foreground">Bank: </span>
                    <span>{bankDetails.bankName}</span>
                  </div>
                )}
                {bankDetails.accountName && (
                  <div>
                    <span className="text-muted-foreground">Account Name: </span>
                    <span>{bankDetails.accountName}</span>
                  </div>
                )}
                {bankDetails.accountNumber && (
                  <div>
                    <span className="text-muted-foreground">Account Number: </span>
                    <span className="font-mono">{bankDetails.accountNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signature Display */}
          {isSigned && invoice.signature && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileSignature className="h-5 w-5" style={{ color: brandColor }} />
                Acknowledgement Signature
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Signed by: </span>
                    <span className="font-medium">{invoice.signature.signerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span>{invoice.signature.signerEmail}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Signed on: </span>
                  <span>{new Date(invoice.signature.signedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" variant="outline" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {canSign && !isSigned && (
              <Button 
                className="flex-1"
                style={{ backgroundColor: brandColor, color: 'white' }}
                onClick={() => navigate(`/i/${token}/sign`)}
              >
                <FileSignature className="h-4 w-4 mr-2" />
                Sign to Acknowledge
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
