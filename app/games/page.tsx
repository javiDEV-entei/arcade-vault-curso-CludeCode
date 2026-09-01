import { GAMES } from "@/app/lib/games";
import { LibraryBrowser } from "@/app/components/LibraryBrowser";

export default function GamesPage() {
  return (
    <div className="fade-in">
      <LibraryBrowser games={GAMES} />
    </div>
  );
}
