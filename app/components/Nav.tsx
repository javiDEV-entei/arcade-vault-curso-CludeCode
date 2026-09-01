"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/app/components/SessionProvider";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useSession();

  const isHome = pathname === "/";
  const isLibrary =
    pathname === "/games" || pathname.startsWith("/juegos");
  const isSalon = pathname === "/salon-de-la-fama";
  const isAuth = pathname === "/entrar";

  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link className={isHome ? "active" : ""} href="/" onClick={close}>
            Inicio
          </Link>
          <Link
            className={isLibrary ? "active" : ""}
            href="/games"
            onClick={close}
          >
            Biblioteca
          </Link>
          <Link
            className={isSalon ? "active" : ""}
            href="/salon-de-la-fama"
            onClick={close}
          >
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer" />
        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button
            className="btn ghost auth-btn"
            onClick={() => {
              close();
              signOut();
            }}
          >
            {user.name} ▾
          </button>
        ) : (
          <Link className="btn auth-btn" href="/entrar" onClick={close}>
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      />
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link className={isHome ? "active" : ""} href="/" onClick={close}>
          Inicio
        </Link>
        <Link
          className={isLibrary ? "active" : ""}
          href="/games"
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          className={isSalon ? "active" : ""}
          href="/salon-de-la-fama"
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          className={isAuth ? "active" : ""}
          href="/entrar"
          onClick={close}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
