import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

    const { disponivel } = await request.json();

    if (typeof disponivel !== "boolean") {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("motoristas")
      .update({ disponivel })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ disponivel });
  } catch (err) {
    console.error("[PATCH /api/disponibilidade]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
