import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { data: corridas, error } = await supabase
      .from("corridas")
      .select("*, profiles!corridas_passageiro_id_fkey(nome, telefone)")
      .eq("status", "aguardando")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ corridas: corridas || [] });
  } catch (err) {
    console.error("[GET /api/corridas-disponiveis]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
