import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, InvoiceItem } from '@/app/contexts/AppContext';
import { AppShell } from '@/app/components/AppShell';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatCurrency } from '@/app/utils/format';
import { getServiceLabels, ServiceUnit } from '@/app/utils/invoice';

export function CreateInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, addInvoice, updateInvoice, invoices } = useApp();

  const existingInvoice = id ? invoices.find(inv => inv.id === id) : null;
  const isEdit = !!existingInvoice;

  const [clientId, setClientId] = useState(existingInvoice?.clientId || '');
  const [invoiceType, setInvoiceType] = useState<'PRODUCT' | 'SERVICE'>(
    existingInvoice?.invoiceType || 'PRODUCT'
  );
  const [serviceUnit, setServiceUnit] = useState<ServiceUnit>(
    existingInvoice?.serviceUnit || 'HOURS'
  );
  const [servicePeriod, setServicePeriod] = useState(existingInvoice?.servicePeriod || '');
  const [issueDate, setIssueDate] = useState(existingInvoice?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(existingInvoice?.dueDate || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    existingInvoice?.items || [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );
  const [taxRate, setTaxRate] = useState(existingInvoice?.taxRate?.toString() || '10');
  const [notes, setNotes] = useState(existingInvoice?.notes || '');

  const serviceLabels = getServiceLabels(serviceUnit);
  const qtyLabel = invoiceType === 'SERVICE' ? serviceLabels.qtyLabel : 'Quantity';
  const unitLabel = invoiceType === 'SERVICE' ? serviceLabels.unitLabel : 'Unit Price';

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = calculateItemTotal(
        field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity,
        field === 'unitPrice' ? parseFloat(value) || 0 : newItems[index].unitPrice
      );
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100;
  const total = subtotal + taxAmount;

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }
    if (!dueDate) {
      toast.error('Please set a due date');
      return;
    }
    if (items.some(item => !item.description.trim())) {
      toast.error('Please fill in all item descriptions');
      return;
    }

    const invoiceData = {
      clientId,
      invoiceType,
      servicePeriod: invoiceType === 'SERVICE' ? servicePeriod : undefined,
      serviceUnit: invoiceType === 'SERVICE' ? serviceUnit : 'UNITS',
      issueDate,
      dueDate,
      status: 'DRAFT' as const,
      items,
      subtotal,
      taxRate: parseFloat(taxRate) || 0,
      taxAmount,
      total,
      notes,
      currency: existingInvoice?.currency || 'NGN',
    };

    try {
      if (isEdit && existingInvoice) {
        await updateInvoice(existingInvoice.id, invoiceData);
        toast.success('Invoice updated');
        navigate(`/invoices/${existingInvoice.id}`);
      } else {
        const created = await addInvoice(invoiceData);
        if (created) {
          toast.success('Invoice created');
          navigate(`/invoices/${created.id}`);
        }
      }
    } catch {
      // Errors are handled in context
    }
  };

  return (
    <AppShell title={isEdit ? 'Edit Invoice' : 'New Invoice'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/invoices')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>

          <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Invoice Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceType">Invoice Type</Label>
                  <Select
                    value={invoiceType}
                    onValueChange={(value: 'PRODUCT' | 'SERVICE') => {
                      setInvoiceType(value);
                      if (value === 'PRODUCT') {
                        setServicePeriod('');
                        setServiceUnit('UNITS');
                      } else if (serviceUnit === 'UNITS') {
                        setServiceUnit('HOURS');
                      }
                    }}
                  >
                    <SelectTrigger id="invoiceType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {invoiceType === 'SERVICE' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="serviceUnit">Service Unit</Label>
                      <Select
                        value={serviceUnit}
                        onValueChange={(value: ServiceUnit) => setServiceUnit(value)}
                      >
                        <SelectTrigger id="serviceUnit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOURS">Hours</SelectItem>
                          <SelectItem value="MONTHS">Months</SelectItem>
                          <SelectItem value="SESSIONS">Sessions</SelectItem>
                          <SelectItem value="UNITS">Units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servicePeriod">Service Period</Label>
                      <Input
                        id="servicePeriod"
                        placeholder="e.g. Feb 9 – May 9, 2026"
                        value={servicePeriod}
                        onChange={(e) => setServicePeriod(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Line Items</h3>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="p-6 space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="space-y-4 pb-4 border-b border-border last:border-0">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>{qtyLabel}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{unitLabel}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <Input
                            value={formatCurrency(item.total)}
                            disabled
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-border bg-muted p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-semibold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Notes</h3>
              <Textarea
                placeholder="Additional notes or payment terms..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSave} className="flex-1 sm:flex-initial">
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Draft' : 'Save Draft'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/invoices')} className="flex-1 sm:flex-initial">
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
