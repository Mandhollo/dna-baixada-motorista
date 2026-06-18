"use client";

// Force dynamic rendering — prevents static cache bypass of middleware auth
export const dynamic = "force-dynamic";

import { useAuth } from "@/components/auth/AuthProvider";
import { useMotoristaGuard } from "@/hooks/useMotoristaGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function PerfilPage() {
  const { user, profile, motorista, supabase, loading, refreshProfile } = useAuth();
  useMotoristaGuard();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    telefone: "",
    veiculo_modelo: "",
    veiculo_placa: "",
    veiculo_cor: "",
    veiculo_lugares: 4,
    cnh: "",
  });

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (profile || motorista) {
      setForm({
        telefone: profile?.telefone || "",
        veiculo_modelo: motorista?.veiculo_modelo || "",
        veiculo_placa: motorista?.veiculo_placa || "",
        veiculo_cor: motorista?.veiculo_cor || "",
        veiculo_lugares: motorista?.veiculo_lugares || 4,
        cnh: motorista?.cnh || "",
      });
    }
  }, [profile, motorista]);

  const handleSalvar = async () => {
    if (!user) return;
    setSalvando(true);
    setSucesso(false);

    try {
      // Update telefone in profiles
      if (form.telefone !== profile?.telefone) {
        await supabase
          .from("profiles")
          .update({ telefone: form.telefone })
          .eq("id", user.id);
      }

      // Update vehicle info in motoristas
      await supabase
        .from("motoristas")
        .update({
          veiculo_modelo: form.veiculo_modelo,
          veiculo_placa: form.veiculo_placa,
          veiculo_cor: form.veiculo_cor,
          veiculo_lugares: form.veiculo_lugares,
          cnh: form.cnh,
        })
        .eq("id", user.id);

      setSucesso(true);
      setEditando(false);
      await refreshProfile();
      setTimeout(() => setSucesso(false), 3000);
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const maskCNH = (cnh: string) => {
    if (!cnh || cnh.length < 4) return cnh;
    return "•".repeat(cnh.length - 4) + cnh.slice(-4);
  };

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
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Perfil</h1>
          <button
            onClick={() => setEditando(!editando)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
              editando
                ? "bg-[#ef4444] text-white"
                : "bg-[#22c55e] text-white"
            }`}
          >
            {editando ? "Cancelar" : "Editar"}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Success message */}
        {sucesso && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-3 text-sm text-[#22c55e] text-center"
          >
            ✅ Perfil atualizado com sucesso!
          </motion.div>
        )}

        {/* Avatar + Name */}
        <div className="flex flex-col items-center py-4">
          <div className="w-24 h-24 bg-[#1e293b] rounded-full flex items-center justify-center border-4 border-[#334155] mb-3">
            {profile?.foto_url ? (
              <div className="w-full h-full rounded-full overflow-hidden">
                <Image
                  src={profile.foto_url}
                  alt="Foto do motorista"
                  className="w-full h-full object-cover"
                  width={96}
                  height={96}
                />
              </div>
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h2 className="text-xl font-bold">{profile?.nome || "Motorista"}</h2>
          <p className="text-sm text-[#94a3b8]">Motorista</p>
        </div>

        {/* Dados Pessoais */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-3">Dados pessoais</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Nome</label>
              <p className="text-sm font-medium text-[#64748b]">{profile?.nome || "—"}</p>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Email</label>
              <p className="text-sm font-medium text-[#64748b]">{user?.email || "—"}</p>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Telefone</label>
              {editando ? (
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-[#f8fafc] focus:outline-none focus:border-[#22c55e]"
                  placeholder="(13) 99999-9999"
                />
              ) : (
                <p className="text-sm font-medium">{form.telefone || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Veículo */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155]">
          <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-3">Veículo</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Modelo</label>
              {editando ? (
                <input
                  type="text"
                  value={form.veiculo_modelo}
                  onChange={(e) => setForm({ ...form, veiculo_modelo: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-[#f8fafc] focus:outline-none focus:border-[#22c55e]"
                  placeholder="Honda Civic"
                />
              ) : (
                <p className="text-sm font-medium">{form.veiculo_modelo || "—"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Placa</label>
                {editando ? (
                  <input
                    type="text"
                    value={form.veiculo_placa}
                    onChange={(e) => setForm({ ...form, veiculo_placa: e.target.value.toUpperCase() })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-[#f8fafc] focus:outline-none focus:border-[#22c55e]"
                    placeholder="ABC-1234"
                  />
                ) : (
                  <p className="text-sm font-medium">{form.veiculo_placa || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Cor</label>
                {editando ? (
                  <input
                    type="text"
                    value={form.veiculo_cor}
                    onChange={(e) => setForm({ ...form, veiculo_cor: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-[#f8fafc] focus:outline-none focus:border-[#22c55e]"
                    placeholder="Preto"
                  />
                ) : (
                  <p className="text-sm font-medium">{form.veiculo_cor || "—"}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Lugares</label>
                {editando ? (
                  <input
                    type="number"
                    value={form.veiculo_lugares}
                    onChange={(e) => setForm({ ...form, veiculo_lugares: parseInt(e.target.value) || 4 })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-[#f8fafc] focus:outline-none focus:border-[#22c55e]"
                    min={1}
                    max={20}
                  />
                ) : (
                  <p className="text-sm font-medium">{form.veiculo_lugares || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">CNH</label>
                {editando ? (
                  <input
                    type="text"
                    value={form.cnh}
                    onChange={(e) => setForm({ ...form, cnh: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-[#f8fafc] focus:outline-none focus:border-[#22c55e]"
                    placeholder="00000000000"
                  />
                ) : (
                  <p className="text-sm font-medium">{form.cnh ? maskCNH(form.cnh) : "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avaliação */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155] text-center">
          <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-2">Avaliação média</p>
          <p className="text-3xl font-bold">
            ⭐ {motorista?.avaliacao?.toFixed(1) || "0.0"}
          </p>
        </div>

        {/* Save button */}
        {editando && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
