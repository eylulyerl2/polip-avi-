import type { Metadata } from "next";
import { PlayLoader } from "@/components/PlayLoader";

export const metadata: Metadata = { title: "Polip Avı · Yapay zeka ile ikinci göz" };

export default function PlayPage() {
  return (
    <main className="absolute inset-0 bg-[#b0405c]">
      <PlayLoader />
    </main>
  );
}
