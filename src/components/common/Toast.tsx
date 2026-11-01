import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full select-none font-mono">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between p-3 rounded-lg border shadow-2xl backdrop-blur-md text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${
              isError
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : isSuccess
                ? 'bg-[#0E1B19]/90 border-emerald-500/50 text-emerald-200'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-[#131720]/90 border-cyan-500/40 text-cyan-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isError && <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
              {isWarning && <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
              {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />}
              <span className="leading-relaxed">{toast.message}</span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white ml-2 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
