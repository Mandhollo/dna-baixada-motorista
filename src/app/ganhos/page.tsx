"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GanhosSemanal {
  semana: string;
  total: number;
  corridas: number;
}

export default function GanhosPage() {
  const { user, supabase, loading } = useAuth();
  const router = useRouter();
  const [ganhosSemanal, setGanhosSemanal] = useState<GanhosSemanal[]>([]);
  const [ganhosMensal, setGanhosMensal] = useState(0);
  const [corridasMes, setCorridasMes] = useState(0);
  const [ganhosHoje, setGanhosHoje] = useState(0);
  const [periodo, setPeriodo] = useState<"semana" | "mes">("semana");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadGanhos();
  }, [user, supabase]);

  const loadGanhos = async () => {
    if (!user) return;

    const agora = new Date();

    // Ganhos hoje
    const inicioHoje = new Date(agora);
    inicioHoje.setHours(0, 0, 0, 0);
    const { data: hoje } = await supabase
      .from("corridas")
      .select("preco_final,preco_estimado")
      .eq("motorista_id", user.id)
      .eq("status", "finalizada")
      .gte("created_at", inicioHoje.toISOString());
    setGanhosHoje(hoje?.reduce((acc: number, c: any) => acc + (c.preco_final ?? c.preco_estimado ?? 0), 0) || 0);

    // Ganhos mensal
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const { data: mes } = await supabase
      .from("corridas")
      .select("preco_final,preco_estimado")
      .eq("motorista_id", user.id)
      .eq("status", "finalizada")
      .gte("created_at", inicioMes.toISOString());

    const totalMes = mes?.reduce((acc: number, c: any) => acc + (c.preco_final ?? c.preco_estimado ?? 0), 0) || 0;
    setGanhosMensal(totalMes);
    setCorridasMes(mes?.length || 0);

    // Últimas 4 semanas
    const semanas: GanhosSemanal[] = [];
    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(agora);
      inicioSemana.setDate(inicioSemana.getDate() - (i * 7) - inicioSemana.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 7);

      const { data: semData } = await supabase
        .from("corridas")
        .select("preco_final,preco_estimado")
        .eq("motorista_id", user.id)
        .eq("status", "finalizada")
        .gte("created_at", inicioSemana.toISOString())
        .lt("created_at", fimSemana.toISOString());

      const total = semData?.reduce((acc: number, c: any) => acc + (c.preco_final ?? c.preco_estimado ?? 0), 0) || 0;
      semanas.push({
        semana: `${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1}`,
        total,
        corridas: semData?.length || 0,
      });
    }
    setGanhosSemanal(semanas);
  };

  const maxGanho = Math.max(...ganhosSemanal.map((g) => g.total), 1);

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
          <h1 className="text-xl font-bold">Ganhos</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155] text-center">
            <p className="text-xs text-[#94a3b8]">Hoje</p>
            <p className="text-2xl font-bold text-[#f59e0b] mt-1">R$ {ganhosHoje.toFixed(2)}</p>
          </div>
          <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155] text-center">
            <p className="text-xs text-[#94a3b8]">Este mês</p>
            <p className="text-2xl font-bold text-[#22c55e] mt-1">R$ {ganhosMensal.toFixed(2)}</p>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <p className="text-sm font-semibold text-[#94a3b8] mb-3">Resumo do mês</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-[#94a3b8]">Corridas realizadas</p>
              <p className="text-2xl font-bold">{corridasMes}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#94a3b8]">Média por corrida</p>
              <p className="text-2xl font-bold text-[#f59e0b]">
                R$ {corridasMes > 0 ? (ganhosMensal / corridasMes).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Chart - Últimas 4 semanas */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <p className="text-sm font-semibold text-[#94a3b8] mb-4">Últimas 4 semanas</p>
          <div className="flex items-end justify-between gap-2 h-40">
            {ganhosSemanal.map((semana, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-[#94a3b8] font-medium">
                  R${semana.total.toFixed(0)}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((semana.total / maxGanho) * 120, 4)}px` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-[#22c55e] to-[#4ade80] rounded-t-lg min-h-[4px]"
                />
                <span className="text-[10px] text-[#94a3b8]">{semana.semana}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <p className="text-sm font-semibold text-[#94a3b8] mb-3">Detalhamento semanal</p>
          <div className="space-y-3">
            {ganhosSemanal.map((semana, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Semana {semana.semana}</p>
                  <p className="text-xs text-[#94a3b8]">{semana.corridas} corridas</p>
                </div>
                <p className="font-bold text-[#f59e0b]">R$ {semana.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
