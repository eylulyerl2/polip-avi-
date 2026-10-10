"use client";

import { useCallback, useState } from "react";
import { parseSeed, randomSeed } from "@/game/rng";
import { Game } from "./Game";

function initialSeed(): number {
  const param = new URLSearchParams(window.location.search).get("seed");
  return param ? parseSeed(param) : randomSeed();
}

/** Browser-only (see PlayLoader): reads ?seed= and owns the current run's seed. */
export function PlayClient() {
  const [seed, setSeed] = useState(initialSeed);

  const replay = useCallback(() => {
    // A fresh seed for every new run; drop ?seed= so the URL does not pin the next run.
    window.history.replaceState(null, "", "/play");
    setSeed(randomSeed());
  }, []);

  return <Game key={seed} seed={seed} onReplay={replay} />;
}
