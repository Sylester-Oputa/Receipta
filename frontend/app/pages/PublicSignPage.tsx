import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { SignaturePad } from '@/app/components/SignaturePad';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { CheckCircle2, Download, FileSignature } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { API_URL, publicApi } from '@/lib/api';
import { formatCurrency } from '@/app/utils/format';

type PublicInvoiceResponse = {
  id: string;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  subtotal: any;
  taxRate: any;
  taxTotal: any;
  total: any;
  brandColor: string;
  business: {
    name: string;
    logoUrl?: string;
  };
  client: {
    name: string;
  };
  signature?: {
    signerName: string;
    signerEmail: string;
    signedAt: string;
  } | null;
};

const toNumber = (value: any) => (value == null ? 0 : Number(value));

export function PublicSignPage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<PublicInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      try {
        const response = await publicApi.viewInvoiceForSign(token);
        setInvoice(response.data);
      } catch {
        setInvoice(null);
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
          <h1 className="text-2xl font-semibold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">This signature link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const brandColor = invoice.brandColor || '#0F172A';
  const alreadySigned = !!invoice.signature;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signerName.trim() || !signerEmail.trim()) {
      toast.error('Please fill in your name and email');
      return;
    }

    if (!acknowledged) {
      toast.error('Please acknowledge the terms');
      return;
    }

    if (!signatureData) {
      toast.error('Please provide your signature');
      return;
    }

    setSubmitting(true);

    try {
      await publicApi.signInvoice(token, {
        signerName,
        signerEmail,
        acknowledge: true,
        signatureDataUrl: signatureData,
      });
      setSuccess(true);
      toast.success('Invoice signed successfully');
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || 'Unable to sign invoice',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadSigned = () => {
    window.open(
      `${API_URL}/v1/public/invoices/pdf/${token}?signed=true`,
      '_blank',
    );
  };

  if (alreadySigned && invoice.signature) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="bg-card border border-border rounded-lg p-8 text-center"
          >
            <div className="mb-4">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Already Signed</h1>
            <p className="text-muted-foreground mb-6">
              This invoice has already been signed by {invoice.signature.signerName} on{' '}
              {new Date(invoice.signature.signedAt).toLocaleDateString()}.
            </p>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownloadSigned}>
              <Download className="h-4 w-4 mr-2" />
              Download Signed Copy
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-card border border-border rounded-lg p-8 text-center"
          >
            <div className="mb-4">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Successfully Signed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for signing {invoice.invoiceNo}. A confirmation has been sent to {signerEmail}.
            </p>
            <Button 
              className="w-full sm:w-auto"
              style={{ backgroundColor: brandColor, color: 'white' }}
              onClick={handleDownloadSigned}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Signed Copy
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

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
          <div className="mb-8 text-center">
            <div className="mb-3">
              <div 
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <FileSignature className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Sign Invoice</h1>
            <p className="text-muted-foreground">
              Please review and sign invoice {invoice.invoiceNo}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Invoice Summary */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-4">
                <div className="h-2" style={{ backgroundColor: brandColor }} />
                <div className="p-6 space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">From</div>
                    <div className="font-semibold">{invoice.business.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">To</div>
                    <div className="font-medium">{invoice.client.name}</div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="text-sm text-muted-foreground mb-1">Invoice Number</div>
                    <div className="font-medium">{invoice.invoiceNo}</div>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                      <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                    </div>
                  )}
                  <div className="border-t border-border pt-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                    <div className="text-2xl font-semibold">{formatCurrency(toNumber(invoice.total))}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold">Your Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signerName">Full Name *</Label>
                    <Input
                      id="signerName"
                      placeholder="John Doe"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      required
                      disabled={submitting}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signerEmail">Email Address *</Label>
                    <Input
                      id="signerEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      required
                      disabled={submitting}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold">Acknowledgement</h3>
                  
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-md">
                    <Checkbox
                      id="acknowledge"
                      checked={acknowledged}
                      onCheckedChange={(checked) => setAcknowledged(!!checked)}
                      disabled={submitting}
                      className="mt-1"
                    />
                    <label htmlFor="acknowledge" className="text-sm cursor-pointer flex-1">
                      I acknowledge that I have reviewed the invoice and agree to the terms and amounts specified.
                    </label>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold">Signature *</h3>
                  <SignaturePad 
                    onSave={setSignatureData}
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting || !acknowledged || !signatureData}
                    style={{ backgroundColor: brandColor, color: 'white' }}
                  >
                    {submitting ? 'Signing...' : 'Sign Invoice'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                    onClick={() => window.history.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
