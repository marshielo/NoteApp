'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Toast {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((listener) => listener({ ...toast, id }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      const duration = toast.duration ?? 5000;
      const timer = setTimeout(() => removeToast(toast.id), duration);
      timersRef.current.set(toast.id, timer);
    };

    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3 shadow-lg"
          role="alert"
        >
          <span className="text-caption text-text-primary">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                removeToast(toast.id);
              }}
              className="shrink-0 text-caption font-semibold text-accent hover:text-accent-hover"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
