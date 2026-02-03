import { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/app/components/ui/button";
import { RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ onSave, disabled = false }: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const handleResize = () => {
      if (sigPadRef.current) {
        const canvas = sigPadRef.current.getCanvas();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClear = () => {
    sigPadRef.current?.clear();
  };

  const handleEnd = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const dataUrl = sigPadRef.current.toDataURL();
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed border-border rounded-md overflow-hidden bg-card ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <SignatureCanvas
          ref={sigPadRef}
          canvasProps={{
            className: "w-full h-48 sm:h-64 touch-none",
            style: { touchAction: "none" },
          }}
          onEnd={handleEnd}
        />
        {sigPadRef.current?.isEmpty() && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm">
            Sign here
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClear}
        disabled={disabled}
        className="w-full sm:w-auto"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Clear Signature
      </Button>
    </div>
  );
}
