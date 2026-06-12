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

    const { data: corridas, error } = await supabase
      .from("corridas")
      .select("*, profiles!corridas_passageiro_id_fkey(nome)")
      .eq("motorista_id", user.id)
      .in("status", ["finalizada", "cancelada"])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ corridas: corridas || [] });
  } catch (err) {
    console.error("[GET /api/minhas-corridas]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
