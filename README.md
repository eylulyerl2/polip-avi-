# polyp-hunt

**Polip Avı** · *Yapay zeka ile ikinci göz* — a mobile-first educational web game about AI-assisted colonoscopy,
built for a GDG x medical students' club conference on AI for early cancer detection.

> Educational game, not a diagnostic tool. All visuals are procedural, no real medical images.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000, also reachable from your LAN
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

### Test on your phone (same Wi-Fi)

1. `npm run dev` already binds to `0.0.0.0`.
2. Find your PC's IP (`ipconfig` -> IPv4 address, e.g. `192.168.1.23`).
3. Open `http://192.168.1.23:3000` on the phone.
4. If it does not load, allow Node.js through Windows Firewall for private networks.

Use `?seed=` to replay an exact run: `/play?seed=12345` (any text works too, e.g. `?seed=konferans`).

## Structure

```
src/content/tr.ts    all Turkish player-facing text (edit this, no code needed)
src/game/            rng, schedule (deterministic), engine (no React), render (canvas), config (all numbers)
src/components/      React wrappers: canvas, HUD, interstitials, results, share card
src/app/             routes: / (start) and /play (game)
tests/               determinism + scoring unit tests (vitest)
```

Tune the game in `src/game/config.ts` (durations, speeds, scores, AI detection rates).
Edit texts in `src/content/tr.ts` (lines marked `TODO: medical review` still need a medical check).

## Deploy (free)

Push to GitHub, import the repo in Vercel (Hobby plan, project name `polyp-hunt`). No environment variables
are needed in Phase 1. Optionally set `NEXT_PUBLIC_SITE_URL` so link previews use your final domain.

## Phase 2 (not built yet)

Room mode with Supabase (Postgres + Realtime) and QR join. `schedule.ts` and `stats.ts` are pure and shared,
so the same seed gives every phone the identical game and the server can compute the maximum possible
score per seed for anti-cheat.
