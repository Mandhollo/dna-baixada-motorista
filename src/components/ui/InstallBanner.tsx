"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show banner after 3 seconds if not dismissed
    const dismissed = localStorage.getItem("install-banner-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("install-banner-dismissed", "true");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 bg-[#1e293b] border border-[#22c55e] rounded-2xl p-4 z-50 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">🚗</div>
            <div className="flex-1">
              <p className="font-bold text-[#f8fafc] text-sm">
                Instale o App DNA Baixada
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">
                Acesse mais rápido direto da tela do celular
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[#94a3b8] hover:text-white p-1"
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleInstall}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl mt-3 text-sm transition-colors"
          >
            Instalar App
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
