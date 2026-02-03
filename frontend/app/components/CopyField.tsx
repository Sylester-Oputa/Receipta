import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

interface CopyFieldProps {
  value: string;
  label?: string;
}

export function CopyField({ value, label }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm">{label}</label>}
      <div className="flex gap-2">
        <Input
          value={value}
          readOnly
          className="flex-1 font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="flex-shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
