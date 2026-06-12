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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: motorista } = await supabase
    .from("motoristas")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile, motorista });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();

  // Update profile fields
  if (body.telefone !== undefined) {
    await supabase
      .from("profiles")
      .update({ telefone: body.telefone })
      .eq("id", user.id);
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
    await supabase
      .from("motoristas")
      .update(motoristaFields)
      .eq("id", user.id);
  }

  return NextResponse.json({ success: true });
}
