import { notFound } from "next/navigation";
import { GAMES, getGame } from "@/app/lib/games";
import { PlayerShell } from "./PlayerShell";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function PlayPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <PlayerShell game={game} />;
}
