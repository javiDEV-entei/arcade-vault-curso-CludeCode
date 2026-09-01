import Link from "next/link";
import type { Game } from "@/app/lib/games";

/**
 * Tarjeta compacta del rail "Juegos disponibles ahora" del Home. Portada de
 * `references/templates/home-about/home.jsx`; el `onClick`/`navigate` del
 * prototipo se sustituye por un `<Link>` a la ruta de detalle.
 */
export function MiniCard({ game }: { game: Game }) {
  return (
    <Link className="mini-card" href={`/juegos/${game.id}`}>
      <div className="mini-cover">
        <div className={"cover-bg " + game.cover} />
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </Link>
  );
}
