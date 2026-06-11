"use client";

import { useState, useEffect } from "react";

interface Corrida {
  id: string;
  tipo: string;
  origem: string;
  destino: string;
  preco: number;
  passageiros: number;
  forma_pagamento: string;
  created_at: string;
  passageiro_id: string;
  profiles?: { nome: string; telefone: string } | null;
}

export default function CorridaCard({
  corrida,
  onAceitar,
  onRecusar,
  loading,
}: {
  corrida: Corrida;
  onAceitar: () => void;
  onRecusar: () => void;
  loading?: boolean;
}) {
  const tipoIcon: Record<string, string> = {
    executivo: "🚗",
    van: "🚐",
    passeio: "🏛️",
    transfer: "✈️",
  };

  const pagamentoIcon: Record<string, string> = {
    dinheiro: "💵",
    pix: "📱",
    cartao: "💳",
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155] fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tipoIcon[corrida.tipo] || "🚗"}</span>
          <span className="text-sm font-semibold text-[#94a3b8] uppercase">
            {corrida.tipo}
          </span>
        </div>
        <span className="text-lg font-bold text-[#f59e0b]">
          R$ {corrida.preco?.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e] mt-1.5 flex-shrink-0" />
          <p className="text-sm text-[#f8fafc]">{corrida.origem}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] mt-1.5 flex-shrink-0" />
          <p className="text-sm text-[#f8fafc]">{corrida.destino}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-xs text-[#94a3b8]">
        <span className="flex items-center gap-1">
          👤 {corrida.passageiros || 1} passageiro(s)
        </span>
        <span className="flex items-center gap-1">
          {pagamentoIcon[corrida.forma_pagamento] || "💰"}{" "}
          {corrida.forma_pagamento}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAceitar}
          disabled={loading}
          className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-base transition-colors active:scale-95"
        >
          {loading ? "..." : "ACEITAR"}
        </button>
        <button
          onClick={onRecusar}
          disabled={loading}
          className="flex-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-50 text-[#94a3b8] font-bold py-3 rounded-xl text-base transition-colors active:scale-95"
        >
          RECUSAR
        </button>
      </div>
    </div>
  );
}
