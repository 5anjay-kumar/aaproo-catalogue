"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckIcon } from "./icons";

type Toast = { id: number; message: string; tone: "ok" | "error" };

const ToastContext = createContext<(message: string, tone?: "ok" | "error") => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lift animate-scale-in"
          >
            {t.tone === "ok" && <CheckIcon width={16} height={16} className="text-accent" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
