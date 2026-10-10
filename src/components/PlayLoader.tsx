"use client";

import dynamic from "next/dynamic";

// Seed handling and canvas drawing only make sense in the browser.
const PlayClient = dynamic(() => import("./PlayClient").then((m) => m.PlayClient), { ssr: false });

export function PlayLoader() {
  return <PlayClient />;
}
