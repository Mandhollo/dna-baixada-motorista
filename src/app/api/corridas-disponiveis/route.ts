import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verify motorista role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "motorista") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { data: corridas } = await supabase
    .from("corridas")
    .select("*, profiles!corridas_passageiro_id_fkey(nome, telefone)")
    .eq("status", "aguardando")
    .order("created_at", { ascending: true });

  return NextResponse.json({ corridas: corridas || [] });
}
