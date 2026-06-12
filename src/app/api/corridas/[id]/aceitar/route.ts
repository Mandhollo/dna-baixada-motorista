import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verify motorista role + aprovado
    const { data: motorista } = await supabase
      .from("motoristas")
      .select("status")
      .eq("id", user.id)
      .single();

    if (!motorista || motorista.status !== "aprovado") {
      return NextResponse.json(
        { error: "Motorista não aprovado" },
        { status: 403 }
      );
    }

    // Accept ride (only if still waiting)
    const { data: corrida, error } = await supabase
      .from("corridas")
      .update({
        motorista_id: user.id,
        status: "aceita",
        aceita_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "aguardando")
      .select()
      .single();

    if (error || !corrida) {
      return NextResponse.json(
        { error: "Corrida não disponível ou já aceita" },
        { status: 400 }
      );
    }

    return NextResponse.json({ corrida });
  } catch (err) {
    console.error("[PATCH /api/corridas/[id]/aceitar]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
