import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/app/contexts/AppContext';
import { AppShell } from '@/app/components/AppShell';
import { StatusBadge } from '@/app/components/StatusBadge';
import { CopyField } from '@/app/components/CopyField';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, Eye, Send, Edit, FileX, Copy, Plus, Download, Clock, CheckCircle2, DollarSign, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, clients, payments, addPayment, sendInvoice, voidInvoice, reviseInvoice, getInvoiceTimeline, settings } = useApp();

  const invoice = invoices.find(inv => inv.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;
  const invoicePayments = invoice ? payments.filter(p => p.invoiceId === invoice.id) : [];
  const timeline = invoice ? getInvoiceTimeline(invoice.id) : [];

  const [showSendModal, setShowSendModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'POS'>('TRANSFER');
  const [paymentNote, setPaymentNote] = useState('');

  if (!invoice || !client) {
    return (
      <AppShell title="Invoice Not Found">
        <div className="p-8 text-center">
          <p>Invoice not found</p>
          <Button onClick={() => navigate('/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </AppShell>
    );
  }

  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.total - totalPaid;

  const canEdit = invoice.status === 'DRAFT';
  const canSend = invoice.status === 'DRAFT';
  const canVoid = invoice.status !== 'VOIDED' && invoicePayments.length === 0;
  const isLocked = invoice.status !== 'DRAFT' && invoice.status !== 'VOIDED';

  const handleSendInvoice = () => {
    sendInvoice(invoice.id);
    setShowSendModal(false);
    toast.success('Invoice sent successfully');
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > balance) {
      toast.error('Payment amount exceeds balance');
      return;
    }

    addPayment({
      invoiceId: invoice.id,
      amount,
      date: paymentDate,
      method: paymentMethod,
      note: paymentNote,
      balanceAfter: balance - amount,
    });

    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentNote('');
    toast.success('Payment recorded successfully');
  };

  const handleVoid = () => {
    if (window.confirm('Are you sure you want to void this invoice? This cannot be undone.')) {
      voidInvoice(invoice.id);
      toast.success('Invoice voided');
    }
  };

  const handleRevise = () => {
    const newId = reviseInvoice(invoice.id);
    navigate(`/invoices/${newId}`);
    toast.success('New revision created');
  };

  const viewUrl = `${window.location.origin}/i/${invoice.viewToken}`;
  const signUrl = `${window.location.origin}/i/${invoice.signToken}/sign`;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/invoices')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>{client.name}</strong></div>
                  <div>Issue: {new Date(invoice.issueDate).toLocaleDateString()}</div>
                  <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canSend && (
                  <Button onClick={() => setShowSendModal(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                )}
                {!canEdit && (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}/preview`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" onClick={handleRevise}>
                      <Copy className="h-4 w-4 mr-2" />
                      Revise
                    </Button>
                  </>
                )}
                {canVoid && (
                  <Button variant="outline" onClick={handleVoid}>
                    <FileX className="h-4 w-4 mr-2" />
                    Void
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lock Indicator */}
          {isLocked && (
            <div className="bg-muted border border-border rounded-lg p-4 mb-6 flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium mb-1">Invoice Locked</div>
                <div className="text-muted-foreground">
                  {invoice.signature 
                    ? 'This invoice has been signed and cannot be edited. Use "Revise" to create a new version.'
                    : 'This invoice has been sent and cannot be edited. Use "Revise" to create a new version.'}
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
              <div className="text-2xl font-semibold">${invoice.total.toFixed(2)}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Paid</div>
              <div className="text-2xl font-semibold text-[var(--success)]">${totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Balance</div>
              <div className="text-2xl font-semibold">${balance.toFixed(2)}</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="payments">Payments & Receipts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Items */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold">Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
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
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                    <span>${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {/* Signature */}
              {invoice.signature && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Signature</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Signed by:</strong> {invoice.signature.signerName}</div>
                    <div><strong>Email:</strong> {invoice.signature.signerEmail}</div>
                    <div><strong>Signed at:</strong> {new Date(invoice.signature.signedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          event.type === 'PAYMENT' ? 'bg-[var(--success)] text-white' :
                          event.type === 'SIGNED' ? 'bg-[var(--status-signed)] text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {event.type === 'PAYMENT' ? <DollarSign className="h-4 w-4" /> :
                           event.type === 'SIGNED' ? <CheckCircle2 className="h-4 w-4" /> :
                           <Clock className="h-4 w-4" />}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">{event.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              {balance > 0 && invoice.status !== 'VOIDED' && (
                <Button onClick={() => setShowPaymentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}

              {invoicePayments.length > 0 ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Receipt No.</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Balance After</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoicePayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 font-medium">{payment.receiptNumber}</td>
                            <td className="px-4 py-3">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 capitalize">{payment.method.toLowerCase()}</td>
                            <td className="px-4 py-3 text-right">${payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">${payment.balanceAfter.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
                  No payments recorded yet
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Send Modal */}
          <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Invoice</DialogTitle>
                <DialogDescription>
                  Share these links with your client. After sending, editing will be disabled.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <CopyField label="View Link (Read Only)" value={viewUrl} />
                <CopyField label="Sign Link (Client Acknowledgement)" value={signUrl} />
                <div className="bg-muted border border-border rounded-md p-4 text-sm">
                  <strong>Note:</strong> After sending, you won&apos;t be able to edit this invoice. Use &quot;Revise&quot; to create a new version if changes are needed.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvoice}>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Payment Modal */}
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Add a new payment for this invoice. Balance remaining: ${balance.toFixed(2)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={balance}
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="POS">POS/Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Payment reference or notes"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPayment}>
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </AppShell>
  );
}
