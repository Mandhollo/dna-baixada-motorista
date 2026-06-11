"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setEnviado(true);
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#0f172a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="text-[#94a3b8] mt-2 text-sm">
            Digite seu email para receber o link de recuperação
          </p>
        </div>

        {enviado ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl p-6">
              <div className="text-4xl mb-3">✉️</div>
              <p className="text-[#22c55e] font-semibold mb-2">Email enviado!</p>
              <p className="text-sm text-[#94a3b8]">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>

            <Link
              href="/"
              className="inline-block mt-6 text-[#22c55e] font-semibold hover:underline"
            >
              Voltar ao login
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleRecuperar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3.5 text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              />
            </div>

            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-3 text-sm text-[#ef4444]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>

            <div className="text-center">
              <Link
                href="/"
                className="text-[#94a3b8] hover:text-[#22c55e] text-sm transition-colors"
              >
                ← Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
