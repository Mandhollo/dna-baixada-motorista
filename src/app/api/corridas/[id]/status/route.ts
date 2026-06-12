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

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["motorista_chegou", "em_andamento", "finalizada", "cancelada"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Only the assigned driver can update status
    const { data: existing } = await supabase
      .from("corridas")
      .select("motorista_id")
      .eq("id", id)
      .single();

    if (!existing || existing.motorista_id !== user.id) {
      return NextResponse.json({ error: "Não autorizado para esta corrida" }, { status: 403 });
    }

    // Build update object with timestamps
    const updateData: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "em_andamento") updateData.iniciada_em = now;
    if (status === "finalizada") updateData.finalizada_em = now;

    const { data: corrida, error } = await supabase
      .from("corridas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ corrida });
  } catch (err) {
    console.error("[PATCH /api/corridas/[id]/status]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
