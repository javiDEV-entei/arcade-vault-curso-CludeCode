"use client";

import { useEffect } from "react";

/**
 * Isla mínima que porta la animación de entrada al hacer scroll del prototipo:
 * observa los elementos con clase `.reveal`, les añade `in` al entrar en el
 * viewport y deja de observarlos. No renderiza nada.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
