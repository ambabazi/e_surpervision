import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

export function Toast({
  message,
  kind = "info",
  onClose,
}: {
  message: string;
  kind?: ToastKind;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-royal-200 bg-royal-50 text-royal-800",
  };
  const Icon = kind === "success" ? CheckCircle2 : kind === "error" ? AlertCircle : Info;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-soft ${styles[kind]}`}
      role="status"
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/5">
        <X size={16} />
      </button>
    </div>
  );
}
