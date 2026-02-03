import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/app/contexts/AppContext';
import { AppShell } from '@/app/components/AppShell';
import { StatusBadge } from '@/app/components/StatusBadge';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';

export function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, clients, settings } = useApp();

  const invoice = invoices.find(inv => inv.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

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

  const brandColor = settings.brandColor;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Invoice Preview */}
          <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden">
            {/* Brand Color Header */}
            <div className="h-3" style={{ backgroundColor: brandColor }} />
            
            <div className="p-8 sm:p-12">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8 pb-8 border-b-2 border-gray-200">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: brandColor }}>
                    {settings.businessName}
                  </h1>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
                    {settings.address}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>{settings.phone}</div>
                    <div>{settings.email}</div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold mb-2">{invoice.invoiceNumber}</div>
                  <StatusBadge status={invoice.status} />
                </div>
              </div>

              {/* Bill To & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-2">BILL TO</div>
                  <div className="font-semibold text-lg mb-1">{client.name}</div>
                  <div className="text-sm text-gray-600">
                    <div>{client.address}</div>
                    <div className="mt-1">{client.email}</div>
                    <div>{client.phone}</div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Issue Date: </span>
                      <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date: </span>
                      <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: brandColor }}>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-white">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-white">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="px-4 py-3 text-sm">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-full sm:w-80 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                    <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div 
                    className="flex justify-between text-lg font-bold pt-3 border-t-2 px-4 py-3 rounded"
                    style={{ borderColor: brandColor, backgroundColor: `${brandColor}15` }}
                  >
                    <span>Total</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mb-8 p-4 bg-gray-50 rounded">
                  <div className="text-sm font-semibold text-gray-500 mb-2">NOTES</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
                </div>
              )}

              {/* Bank Details */}
              {(settings.bankName || settings.accountNumber) && (
                <div className="mb-8 p-4 border-2 border-gray-200 rounded">
                  <div className="text-sm font-semibold text-gray-500 mb-2">PAYMENT INFORMATION</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    {settings.bankName && (
                      <div>
                        <span className="text-gray-500">Bank: </span>
                        <span className="font-medium">{settings.bankName}</span>
                      </div>
                    )}
                    {settings.accountName && (
                      <div>
                        <span className="text-gray-500">Account Name: </span>
                        <span className="font-medium">{settings.accountName}</span>
                      </div>
                    )}
                    {settings.accountNumber && (
                      <div>
                        <span className="text-gray-500">Account Number: </span>
                        <span className="font-mono font-medium">{settings.accountNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signature */}
              {invoice.signature && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <div className="text-sm font-semibold text-gray-500 mb-3">ACKNOWLEDGEMENT SIGNATURE</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Signed by: </span>
                      <span className="font-medium">{invoice.signature.signerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email: </span>
                      <span>{invoice.signature.signerEmail}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Date: </span>
                      <span className="font-medium">{new Date(invoice.signature.signedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-1">This invoice was generated by Invoxa</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
