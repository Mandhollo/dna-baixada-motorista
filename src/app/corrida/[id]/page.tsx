"use client";

// Force dynamic rendering — prevents static cache bypass of middleware auth
export const dynamic = "force-dynamic";

import { useAuth } from "@/components/auth/AuthProvider";
import { useMotoristaGuard } from "@/hooks/useMotoristaGuard";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamicImport from "next/dynamic";

const MapContainer = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface Corrida {
  id: string;
  tipo: string;
  origem: string;
  destino: string;
  preco: number;
  passageiros: number;
  forma_pagamento: string;
  status: string;
  passageiro_id: string;
  origem_lat: number | null;
  origem_lng: number | null;
  destino_lat: number | null;
  destino_lng: number | null;
  profiles?: { nome: string; telefone: string } | null;
}

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  aceita: [
    { next: "motorista_chegou", label: "Cheguei no local", color: "bg-[#22c55e]" },
    { next: "em_andamento", label: "Iniciar corrida", color: "bg-[#3b82f6]" },
  ],
  motorista_chegou: [
    { next: "em_andamento", label: "Iniciar corrida", color: "bg-[#3b82f6]" },
  ],
  em_andamento: [
    { next: "finalizada", label: "Finalizar corrida", color: "bg-[#f59e0b]" },
  ],
};

export default function CorridaPage() {
  const { user, supabase, loading } = useAuth();
  useMotoristaGuard();
  const router = useRouter();
  const params = useParams();
  const corridaId = params.id as string;

  const [corrida, setCorrida] = useState<Corrida | null>(null);
  const [updating, setUpdating] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  const loadCorrida = useCallback(async () => {
    if (!user || !corridaId) return;
    const { data } = await supabase
      .from("corridas")
      .select("*, profiles!corridas_passageiro_id_fkey(nome, telefone)")
      .eq("id", corridaId)
      .single();

    if (data) {
      setCorrida(data as Corrida);
      if (!mapReady && typeof window !== "undefined") {
        import("leaflet").then(() => setMapReady(true));
      }
    }
  }, [user, corridaId, supabase, mapReady]);

  useEffect(() => {
    loadCorrida();
  }, [loadCorrida]);

  // Real-time updates
  useEffect(() => {
    if (!corridaId) return;
    const channel = supabase
      .channel(`corrida-${corridaId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "corridas", filter: `id=eq.${corridaId}` },
        (payload) => {
          if (payload.new) {
            setCorrida((prev) => prev ? { ...prev, ...payload.new } as Corrida : prev);
            if (payload.new.status === "cancelada") {
              setErro("Corrida cancelada pelo passageiro");
              router.push("/dashboard");
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [corridaId, supabase, router]);

  const updateStatus = async (newStatus: string) => {
    if (!corrida) return;
    setUpdating(true);
    const { error } = await supabase
      .from("corridas")
      .update({ status: newStatus })
      .eq("id", corrida.id);

    if (!error) {
      setCorrida((prev) => prev ? { ...prev, status: newStatus } : prev);
      if (newStatus === "finalizada") {
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } else {
      setErro("Erro ao atualizar status. Tente novamente.");
    }
    setUpdating(false);
  };

  const openWhatsApp = (telefone: string) => {
    const numero = telefone?.replace(/\D/g, "");
    window.open(`https://wa.me/55${numero}`, "_blank");
  };

  const callPhone = (telefone: string) => {
    window.open(`tel:${telefone}`, "_self");
  };

  if (loading || !corrida) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    aguardando: "Aguardando",
    aceita: "Aceita",
    motorista_chegou: "Motorista chegou",
    em_andamento: "Em andamento",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  };

  const actions = STATUS_FLOW[corrida.status] || [];

  return (
    <div className="min-h-dvh pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-sm z-40 border-b border-[#334155]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e293b]"
          >
            ←
          </button>
          <div className="flex-1">
            <p className="font-bold text-sm">Corrida</p>
            <p className="text-xs text-[#94a3b8]">{statusLabel[corrida.status]}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            corrida.status === "em_andamento" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
            corrida.status === "finalizada" ? "bg-[#22c55e]/20 text-[#22c55e]" :
            "bg-[#f59e0b]/20 text-[#f59e0b]"
          }`}>
            {statusLabel[corrida.status]}
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Passageiro Info */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <p className="text-xs text-[#94a3b8] mb-2 font-semibold uppercase">Passageiro</p>
          <p className="text-lg font-bold">{corrida.profiles?.nome || "Passageiro"}</p>
          {corrida.profiles?.telefone && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => callPhone(corrida.profiles!.telefone)}
                className="flex-1 bg-[#3b82f6] text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                📞 Ligar
              </button>
              <button
                onClick={() => openWhatsApp(corrida.profiles!.telefone)}
                className="flex-1 bg-[#22c55e] text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                💬 WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Ride Details */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#22c55e] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#94a3b8]">Origem</p>
                <p className="text-sm font-medium">{corrida.origem}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ef4444] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#94a3b8]">Destino</p>
                <p className="text-sm font-medium">{corrida.destino}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#334155]">
            <div className="text-center">
              <p className="text-xs text-[#94a3b8]">Valor</p>
              <p className="text-lg font-bold text-[#f59e0b]">R${corrida.preco?.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#94a3b8]">Tipo</p>
              <p className="text-sm font-semibold">{corrida.tipo}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#94a3b8]">Pgto</p>
              <p className="text-sm font-semibold">{corrida.forma_pagamento}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        {mapReady && corrida.origem_lat && corrida.destino_lat && (
          <div className="rounded-2xl overflow-hidden border border-[#334155] h-64">
            <MapContainer
              center={[corrida.origem_lat, corrida.origem_lng || -46.3]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[corrida.origem_lat, corrida.origem_lng || -46.3]}>
                <Popup>Origem</Popup>
              </Marker>
              <Marker position={[corrida.destino_lat, corrida.destino_lng || -46.3]}>
                <Popup>Destino</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="space-y-3">
            {actions.map((action) => (
              <motion.button
                key={action.next}
                whileTap={{ scale: 0.97 }}
                onClick={() => updateStatus(action.next)}
                disabled={updating}
                className={`w-full ${action.color} text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-50 active:scale-[0.98] transition-transform`}
              >
                {updating ? "Atualizando..." : action.label}
              </motion.button>
            ))}
          </div>
        )}

        {corrida.status === "finalizada" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-5xl mb-3">✅</div>
            <p className="text-xl font-bold text-[#22c55e]">Corrida finalizada!</p>
            <p className="text-[#94a3b8] mt-1">Voltando ao dashboard...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
