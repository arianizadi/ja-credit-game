# Debt Avalanche 💳🏔️

An educational game about paying off credit card debt the smart way. You owe
$1,050 across three cards, each with its own APR, minimum payment, and due
date. Work each payday (the 1st and 15th) to earn cash in a quick mini-game,
then decide how to spend it — pay minimums to dodge $35 late fees, and throw
everything else at the highest-APR card. That's the **debt avalanche method**,
and the game grades you on how well you follow it.

## How it works

- **Interest compounds daily** — balances are tracked in integer cents with a
  sub-cent carry, so the math is exact (`app/game/engine.ts` is a pure,
  UI-free engine).
- **Miss a minimum by the due date** and a $35 late fee lands on the balance —
  and starts accruing interest itself.
- **The results screen** shows your grade, your debt curve day by day, and how
  much money and time your strategy saved versus paying only minimums.

The UI is built entirely with SVG (cards, timeline, mini-game, charts) — no
WebGL/three.js — plus Tailwind CSS and Framer Motion inside Next.js.

## Development

```bash
bun install
bun dev        # http://localhost:3000
bun run lint   # biome
bun run build
```

Game progress is saved to `localStorage`; use the in-game Reset button to
start over.
