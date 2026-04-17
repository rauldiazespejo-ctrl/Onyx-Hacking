import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type Toast } from "../../hooks/useToast";

const icons = {
  success: <CheckCircle size={16} className="text-[#27C93F]" />,
  error: <XCircle size={16} className="text-[#FF3366]" />,
  warning: <AlertTriangle size={16} className="text-[#FFB800]" />,
  info: <Info size={16} className="text-[#4A9EFF]" />,
};

const borderColors = {
  success: "border-[#27C93F]/30",
  error: "border-[#FF3366]/30",
  warning: "border-[#FFB800]/30",
  info: "border-[#4A9EFF]/30",
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [toast.duration]);

  return (
    <div
      className={`flex items-start gap-3 bg-surface border ${borderColors[toast.type]} rounded-lg px-4 py-3 shadow-xl min-w-[300px] max-w-[420px] animate-[slideIn_0.2s_ease-out]`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text">{toast.title}</p>
        {toast.message && <p className="text-xs text-text-muted mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onClose} className="text-text-muted hover:text-text flex-shrink-0">
        <X size={14} />
      </button>
      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${
            toast.type === "success" ? "bg-[#27C93F]" :
            toast.type === "error" ? "bg-[#FF3366]" :
            toast.type === "warning" ? "bg-[#FFB800]" : "bg-[#4A9EFF]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
