# ACM Feud

Local Family Feud style game built with Vite, React, and Convex.

## What it does

- Two players buzz in from the same keyboard.
- The first key press wins the buzzer.
- The admin can queue multiple rounds before the match starts.
- The game board updates live as answers are revealed.
- Wrong guesses create team-specific strikes instead of one shared strike counter.
- The board plays built-in sound effects and animations for buzzes, correct answers, and strikes.
- An admin can open `/admin` on a phone and tap to reveal answers, mark guesses wrong, jump rounds, and manage strikes.

## Setup

1. Install dependencies with `npm install`.
2. Start Convex and generate the real client bindings with `npx convex dev`.
3. Let Convex replace the placeholder files in `convex/_generated/`.
4. Put the Convex URL into `.env.local`:

```bash
VITE_CONVEX_URL=your_convex_url_here
```

5. Start the app with `npm run dev`.

## Routes

- `/` shows the player-facing board, listens for buzzer keys, and plays the round feedback sounds.
- `/admin` shows the match planner and phone-friendly host controls.
