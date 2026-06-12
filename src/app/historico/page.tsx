"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useMotoristaGuard } from "@/hooks/useMotoristaGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CorridaHistorico {
  id: string;
  tipo: string;
  origem: string;
  destino: string;
  preco: number;
  status: string;
  created_at: string;
  profiles?: { nome: string } | null;
}

type Filtro = "hoje" | "semana" | "mes" | "tudo";

export default function HistoricoPage() {
  const { user, supabase, loading } = useAuth();
  useMotoristaGuard();
  const router = useRouter();
  const [corridas, setCorridas] = useState<CorridaHistorico[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("hoje");
  const [totalGanhos, setTotalGanhos] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadCorridas();
  }, [user, filtro, supabase]);

  const loadCorridas = async () => {
    if (!user) return;

    let query = supabase
      .from("corridas")
      .select("*, profiles!corridas_passageiro_id_fkey(nome)")
      .eq("motorista_id", user.id)
      .in("status", ["finalizada", "cancelada"])
      .order("created_at", { ascending: false });

    const agora = new Date();

    if (filtro === "hoje") {
      const inicio = new Date(agora);
      inicio.setHours(0, 0, 0, 0);
      query = query.gte("created_at", inicio.toISOString());
    } else if (filtro === "semana") {
      const inicio = new Date(agora);
      inicio.setDate(inicio.getDate() - 7);
      query = query.gte("created_at", inicio.toISOString());
    } else if (filtro === "mes") {
      const inicio = new Date(agora);
      inicio.setMonth(inicio.getMonth() - 1);
      query = query.gte("created_at", inicio.toISOString());
    }

    const { data } = await query;
    setCorridas((data as CorridaHistorico[]) || []);
    const total = (data || []).reduce((acc: number, c: any) => acc + (c.status === "finalizada" ? c.preco || 0 : 0), 0);
    setTotalGanhos(total);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const filtros: { key: Filtro; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
    { key: "tudo", label: "Tudo" },
  ];

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-sm z-40 border-b border-[#334155]">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Histórico</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Total */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155] text-center">
          <p className="text-sm text-[#94a3b8]">Total ganho no período</p>
          <p className="text-3xl font-bold text-[#f59e0b] mt-1">R$ {totalGanhos.toFixed(2)}</p>
          <p className="text-xs text-[#94a3b8] mt-1">{corridas.length} corrida(s)</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                filtro === f.key
                  ? "bg-[#22c55e] text-white"
                  : "bg-[#1e293b] text-[#94a3b8] border border-[#334155]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {corridas.length > 0 ? (
          <div className="space-y-3">
            {corridas.map((corrida) => (
              <motion.div
                key={corrida.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#94a3b8]">
                    {formatDate(corrida.created_at)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    corrida.status === "finalizada"
                      ? "bg-[#22c55e]/20 text-[#22c55e]"
                      : "bg-[#ef4444]/20 text-[#ef4444]"
                  }`}>
                    {corrida.status === "finalizada" ? "Finalizada" : "Cancelada"}
                  </span>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#22c55e]">●</span> {corrida.origem}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#ef4444]">●</span> {corrida.destino}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
                  <span className="text-xs text-[#94a3b8] capitalize">{corrida.tipo}</span>
                  <span className="font-bold text-[#f59e0b]">R$ {corrida.preco?.toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-[#94a3b8]">Nenhuma corrida no período</p>
          </div>
        )}
      </div>
    </div>
  );
}
