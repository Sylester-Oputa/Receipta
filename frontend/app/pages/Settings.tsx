import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/contexts/AppContext';
import { AppShell } from '@/app/components/AppShell';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Save, Check, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

export function Settings() {
  const { settings, updateSettings, uploadLogo } = useApp();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showRemoveLogo, setShowRemoveLogo] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setFormData(settings);
    }
  }, [isDirty, settings]);

  const updateForm = (
    updates: Partial<typeof formData>,
    options?: { markDirty?: boolean },
  ) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (options?.markDirty ?? true) {
      setIsDirty(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings(formData);
      setIsDirty(false);
      toast.success('Settings saved successfully');
    } catch {
      // Errors are handled in context
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      toast.error('Logo must be a PNG or JPG file');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be 2MB or smaller');
      e.target.value = '';
      return;
    }

    setLogoUploading(true);
    const uploadedUrl = await uploadLogo(file);
    if (uploadedUrl) {
      updateForm({ logoUrl: uploadedUrl }, { markDirty: false });
      toast.success('Logo uploaded');
    }
    setLogoUploading(false);
    e.target.value = '';
  };

  const handleRemoveLogo = async () => {
    setLogoUploading(true);
    try {
      await updateSettings({ logoUrl: null });
      updateForm({ logoUrl: '' }, { markDirty: false });
      toast.success('Logo removed');
    } catch {
      // Errors are handled in context
    } finally {
      setLogoUploading(false);
      setShowRemoveLogo(false);
    }
  };

  const getContrastColor = (hexColor: string): string => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      return '#ffffff';
    }
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const isBrandColorValid = /^#[0-9A-Fa-f]{6}$/.test(formData.brandColor);
  const contrastColor = getContrastColor(formData.brandColor);
  const hasChanges = useMemo(() => {
    return (
      formData.businessName !== settings.businessName ||
      formData.address !== settings.address ||
      formData.phone !== settings.phone ||
      formData.email !== settings.email ||
      formData.logoUrl !== settings.logoUrl ||
      formData.bankName !== settings.bankName ||
      formData.accountName !== settings.accountName ||
      formData.accountNumber !== settings.accountNumber ||
      formData.brandColor !== settings.brandColor
    );
  }, [formData, settings]);
  const canSave = hasChanges && isBrandColorValid && !saving && !logoUploading;
  const safeBrandColor = isBrandColorValid ? formData.brandColor : '#0F172A';
  const logoUrl = formData.logoUrl || '';

  return (
    <AppShell title="Settings">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your business profile and branding
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Profile */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Business Profile</h3>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => updateForm({ businessName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => updateForm({ address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Bank Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => updateForm({ bankName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => updateForm({ accountName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => updateForm({ accountNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Branding */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Branding</h3>

              <div className="space-y-2">
                <Label htmlFor="logo">Business Logo (PNG or JPG)</Label>
                {logoUrl && (
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="Business logo"
                      className="h-12 w-auto rounded border border-border bg-white p-1"
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {logoUrl}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRemoveLogo(true)}
                      disabled={logoUploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                />
                <p className="text-sm text-muted-foreground">
                  PNG or JPG, max 2MB. Uploads are saved immediately.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Primary Color</Label>
                <div className="flex gap-3">
                  <div className="relative">
                    <Input
                      id="brandColor"
                      type="color"
                      value={safeBrandColor}
                      onChange={(e) => updateForm({ brandColor: e.target.value })}
                      className="w-20 h-11 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={formData.brandColor}
                    onChange={(e) => updateForm({ brandColor: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                {!isBrandColorValid && (
                  <p className="text-sm text-[var(--status-danger)]">
                    Use a 6-digit hex color like #1F2937.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  This color will be used as an accent in invoice previews and PDFs
                </p>
              </div>

              <AlertDialog open={showRemoveLogo} onOpenChange={setShowRemoveLogo}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove business logo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the logo from invoices and PDFs. You can upload a new one anytime.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveLogo}>
                      Remove Logo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Color Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Color Chip</div>
                    <div 
                      className="h-24 rounded-md border border-border flex items-center justify-center font-medium"
                      style={{ backgroundColor: safeBrandColor, color: contrastColor }}
                    >
                      {safeBrandColor}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Contrast Safe Text</div>
                    <div className="h-24 border border-border rounded-md p-4 flex flex-col justify-center">
                      <div className="text-sm font-medium mb-1">Suggested text color:</div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: contrastColor }}
                        />
                        <span className="text-sm">{contrastColor}</span>
                        <Check className="h-4 w-4 text-[var(--success)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Preview Sample */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Invoice Header Preview</div>
                <div className="border border-border rounded-md overflow-hidden">
                  <div 
                    className="h-2"
                    style={{ backgroundColor: safeBrandColor }}
                  />
                  <div className="p-4 bg-card">
                    <div className="text-sm font-medium mb-1">{formData.businessName}</div>
                    <div className="text-xs text-muted-foreground">Invoice #INV-2026-0001</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" disabled={!canSave}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AppShell>
  );
}
