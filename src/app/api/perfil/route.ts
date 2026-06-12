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

    const { data: profile, error: e1 } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: motorista, error: e2 } = await supabase
      .from("motoristas")
      .select("*")
      .eq("id", user.id)
      .single();

    if (e1) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ profile, motorista });
  } catch (err) {
    console.error("[GET /api/perfil]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Update profile fields
    if (body.telefone !== undefined) {
      const { error } = await supabase
        .from("profiles")
        .update({ telefone: body.telefone })
        .eq("id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Update motorista fields
    const motoristaFields: Record<string, any> = {};
    const allowedFields = [
      "veiculo_modelo",
      "veiculo_placa",
      "veiculo_cor",
      "veiculo_lugares",
      "cnh_numero",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        motoristaFields[field] = body[field];
      }
    }

    if (Object.keys(motoristaFields).length > 0) {
      const { error } = await supabase
        .from("motoristas")
        .update(motoristaFields)
        .eq("id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/perfil]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
