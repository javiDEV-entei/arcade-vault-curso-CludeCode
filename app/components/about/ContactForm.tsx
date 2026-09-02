"use client";

import { useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  email: string;
  msg: string;
};

type Status = "idle" | "sending" | "success" | "error";

const EMPTY_FORM: FormState = { name: "", email: "", msg: "" };

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");
  const [shake, setShake] = useState(false);
  const [sentName, setSentName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const invalid = () =>
    !form.name.trim() ||
    !form.email.trim() ||
    !form.msg.trim() ||
    !EMAIL_RE.test(form.email.trim());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSentName(form.name.trim());
        setStatus("success");
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error ?? "No se pudo enviar el mensaje.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("No se pudo conectar con el servidor.");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setSentName(null);
    setErrorMsg(null);
    setForm(EMPTY_FORM);
  };

  const retry = () => {
    setStatus("idle");
    setErrorMsg(null);
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
      {status === "idle" || status === "sending" ? (
        <>
          <div className="field">
            <label>NOMBRE</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label>CORREO ELECTRÓNICO</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label>MENSAJE</label>
            <textarea
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>
          <button
            className="btn xl press"
            type="submit"
            style={{ width: "100%" }}
            disabled={status === "sending"}
          >
            {status === "sending" ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            {status === "success" ? (
              <div className="line success">
                &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
                {sentName?.toUpperCase()}.<span className="caret">_</span>
              </div>
            ) : (
              <div className="line error">
                &gt; ERROR: NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO.
                <span className="caret">_</span>
              </div>
            )}
            {errorMsg && status === "error" && (
              <div className="line dim">// {errorMsg}</div>
            )}
            <div style={{ marginTop: 18 }}>
              {status === "success" ? (
                <button className="btn ghost" type="button" onClick={reset}>
                  ENVIAR OTRO MENSAJE
                </button>
              ) : (
                <button className="btn ghost" type="button" onClick={retry}>
                  REINTENTAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
