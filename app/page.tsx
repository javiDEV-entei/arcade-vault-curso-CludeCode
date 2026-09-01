import { redirect } from "next/navigation";

export default function Home() {
  // Temporal: la landing page se implementa en el paso 4 de la SPEC 02.
  redirect("/games");
}
