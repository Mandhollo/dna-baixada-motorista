"use client";

// Force dynamic rendering — prevents static cache bypass of middleware auth
export const dynamic = "force-dynamic";

import { useAuth } from "@/components/auth/AuthProvider";
import { useMotoristaGuard } from "@/hooks/useMotoristaGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CorridaCard from "@/components/corrida/CorridaCard";

interface CorridaDisponivel {
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

export default function DashboardPage() {
  const { user, profile, motorista, supabase, loading, signOut } = useAuth();
  useMotoristaGuard();
  const router = useRouter();
  const [disponivel, setDisponivel] = useState(false);
  const [corridas, setCorridas] = useState<CorridaDisponivel[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [stats, setStats] = useState({ corridasHoje: 0, ganhosHoje: 0, avaliacao: 0 });
  const [aceitandoId, setAceitandoId] = useState<string | null>(null);
  const [corridaAtiva, setCorridaAtiva] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  // Check auth
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Load initial data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Check for active ride
      const { data: ativa } = await supabase
        .from("corridas")
        .select("id")
        .eq("motorista_id", user.id)
        .in("status", ["aceita", "em_andamento", "motorista_chegou"])
        .maybeSingle();

      if (ativa) {
        setCorridaAtiva(ativa.id);
        router.push(`/corrida/${ativa.id}`);
        return;
      }

      // Load disponibilidade
      if (motorista) {
        setDisponivel(motorista.disponivel || false);
        setStats((prev) => ({ ...prev, avaliacao: motorista.avaliacao || 0 }));
      }

      // Load stats
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const { data: corridasHoje } = await supabase
        .from("corridas")
        .select("preco_final,preco_estimado")
        .eq("motorista_id", user.id)
        .eq("status", "finalizada")
        .gte("created_at", hoje.toISOString());

      const totalCorridas = corridasHoje?.length || 0;
      const totalGanhos = corridasHoje?.reduce((acc: number, c: any) => acc + (c.preco_final ?? c.preco_estimado ?? 0), 0) || 0;
      setStats({ corridasHoje: totalCorridas, ganhosHoje: totalGanhos, avaliacao: motorista?.avaliacao || 0 });
    };

    loadData();
  }, [user, motorista, supabase, router]);

  // Fetch available rides when online
  const fetchCorridas = useCallback(async () => {
    if (!disponivel || !user) return;

    const { data } = await supabase
      .from("corridas")
      .select("*, profiles!corridas_passageiro_id_fkey(nome, telefone)")
      .eq("status", "aguardando")
      .order("created_at", { ascending: true });

    setCorridas((data as CorridaDisponivel[]) || []);
  }, [disponivel, supabase, user]);

  useEffect(() => {
    fetchCorridas();
    if (!disponivel) return;
    const interval = setInterval(fetchCorridas, 10000);
    return () => clearInterval(interval);
  }, [disponivel, fetchCorridas]);

  // Real-time subscription for new rides
  useEffect(() => {
    if (!disponivel) return;

    const channel = supabase
      .channel("corridas-disponiveis")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "corridas", filter: "status=eq.aguardando" },
        () => fetchCorridas()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "corridas" },
        () => fetchCorridas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [disponivel, supabase, fetchCorridas]);

  const toggleDisponibilidade = async () => {
    if (!user || !motorista) return;
    setToggling(true);
    const novoValor = !disponivel;
    setDisponivel(novoValor);

    await supabase
      .from("motoristas")
      .update({ disponivel: novoValor })
      .eq("id", user.id);

    if (!novoValor) setCorridas([]);
    setToggling(false);
  };

  const handleAceitar = async (corridaId: string) => {
    if (!user) return;
    setAceitandoId(corridaId);

    const { error } = await supabase
      .from("corridas")
      .update({ motorista_id: user.id, status: "aceita" })
      .eq("id", corridaId)
      .eq("status", "aguardando");

    if (!error) {
      router.push(`/corrida/${corridaId}`);
    } else {
      setErro("Erro ao aceitar corrida. Tente novamente.");
      fetchCorridas();
    }
    setAceitandoId(null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#94a3b8] mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (corridaAtiva) return null;

  return (
    <div className="min-h-dvh pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-sm z-40 border-b border-[#334155]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center">
              <span className="text-xl">🚗</span>
            </div>
            <div>
              <p className="font-bold text-sm">Olá, {profile?.nome?.split(" ")[0] || "Motorista"}</p>
              <p className="text-xs text-[#94a3b8]">DNA Baixada</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-[#94a3b8] hover:text-[#ef4444] text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Online/Offline Toggle */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={toggleDisponibilidade}
          disabled={toggling}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all ${
            disponivel
              ? "bg-[#22c55e] pulse-green text-white"
              : "bg-[#1e293b] border-2 border-[#334155] text-[#94a3b8]"
          }`}
        >
          {toggling ? (
            "..."
          ) : disponivel ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              DISPONÍVEL
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-[#475569] rounded-full" />
              INDISPONÍVEL
            </span>
          )}
        </motion.button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1e293b] rounded-xl p-3 text-center border border-[#334155]">
            <p className="text-2xl font-bold text-[#f8fafc]">{stats.corridasHoje}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Corridas hoje</p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-3 text-center border border-[#334155]">
            <p className="text-2xl font-bold text-[#f59e0b]">R${stats.ganhosHoje.toFixed(0)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Ganhos hoje</p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-3 text-center border border-[#334155]">
            <p className="text-2xl font-bold text-[#f8fafc]">⭐ {stats.avaliacao.toFixed(1)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Avaliação</p>
          </div>
        </div>

        {/* Corridas Disponíveis */}
        {disponivel && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              Corridas disponíveis
              <span className="bg-[#22c55e] text-white text-xs px-2 py-0.5 rounded-full">
                {corridas.length}
              </span>
            </h2>

            <AnimatePresence>
              {corridas.length > 0 ? (
                <div className="space-y-3">
                  {corridas.map((corrida) => (
                    <CorridaCard
                      key={corrida.id}
                      corrida={corrida}
                      onAceitar={() => handleAceitar(corrida.id)}
                      onRecusar={() =>
                        setCorridas((prev) => prev.filter((c) => c.id !== corrida.id))
                      }
                      loading={aceitandoId === corrida.id}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#94a3b8] text-base">
                    Nenhuma corrida disponível no momento
                  </p>
                  <p className="text-[#64748b] text-sm mt-2">
                    Atualizando automaticamente...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!disponivel && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💤</div>
            <p className="text-[#94a3b8] text-base">
              Fique online para receber corridas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
