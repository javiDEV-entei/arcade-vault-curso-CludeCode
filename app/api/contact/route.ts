import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};

export async function POST(request: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const msg = body.msg?.trim() ?? "";

  if (!name || !email || !msg) {
    return Response.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "El correo electrónico no tiene un formato válido." },
      { status: 400 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email,
      subject: `Nuevo mensaje de ${name} — Arcade Vault`,
      text: `De: ${name} <${email}>\n\n${msg}`,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  } catch {
    return Response.json(
      { error: "No se pudo enviar el mensaje." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
