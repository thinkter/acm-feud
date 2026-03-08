import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { keyMatches } from "../lib/formatting";

const panelClassName =
  "rounded-[28px] border border-pink-200/10 bg-[linear-gradient(180deg,rgba(30,5,21,0.96),rgba(14,2,11,0.96))] shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur";
const softPanelClassName =
  "rounded-[24px] border border-pink-200/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
const eyebrowClassName =
  "text-[0.72rem] uppercase tracking-[0.28em] text-pink-200/65";
const feedbackClasses: Record<string, string> = {
  "": "",
  "feedback-correct":
    "shadow-[0_0_0_1px_rgba(250,204,21,0.18),0_0_55px_rgba(250,204,21,0.12)]",
  "feedback-wrong":
    "shadow-[0_0_0_1px_rgba(251,113,133,0.18),0_0_55px_rgba(251,113,133,0.14)]",
  "feedback-buzz":
    "shadow-[0_0_0_1px_rgba(244,114,182,0.18),0_0_55px_rgba(244,114,182,0.16)]",
  "feedback-round":
    "shadow-[0_0_0_1px_rgba(236,72,153,0.18),0_0_55px_rgba(236,72,153,0.14)]",
};

function playTone(
  context: AudioContext,
  frequency: number,
  duration: number,
  gainValue: number,
  type: OscillatorType,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playEventSound(context: AudioContext, type: string) {
  if (type === "correct") {
    playTone(context, 523.25, 0.14, 0.08, "triangle");
    setTimeout(() => playTone(context, 659.25, 0.16, 0.08, "triangle"), 120);
    setTimeout(() => playTone(context, 783.99, 0.2, 0.09, "triangle"), 240);
    return;
  }

  if (type === "wrong") {
    playTone(context, 220, 0.18, 0.1, "sawtooth");
    setTimeout(() => playTone(context, 180, 0.22, 0.09, "sawtooth"), 120);
    return;
  }

  if (type === "buzz") {
    playTone(context, 392, 0.12, 0.08, "square");
    return;
  }

  playTone(context, 440, 0.08, 0.05, "sine");
  setTimeout(() => playTone(context, 554.37, 0.1, 0.05, "sine"), 90);
}

export function GameBoard() {
  const game = useQuery(api.game.current, {}) as any;
  const registerBuzz = useMutation(api.game.registerBuzz);
  const pressedKeys = useRef(new Set<string>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousEventId = useRef<string | null>(null);
  const previousRevealedCount = useRef(0);
  const [feedbackClass, setFeedbackClass] = useState("");
  const [highlightAnswerId, setHighlightAnswerId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!game) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const key = event.key.toUpperCase();
      if (pressedKeys.current.has(key)) {
        return;
      }

      pressedKeys.current.add(key);

      if (keyMatches(key, game.playerOneKey)) {
        void registerBuzz({ player: "player1", pressedAt: Date.now() });
      }

      if (keyMatches(key, game.playerTwoKey)) {
        void registerBuzz({ player: "player2", pressedAt: Date.now() });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [game, registerBuzz]);

  useEffect(() => {
    const activateAudio = async () => {
      if (typeof window === "undefined") {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
    };

    const handler = () => {
      void activateAudio();
    };

    window.addEventListener("keydown", handler, { once: true });
    window.addEventListener("pointerdown", handler, { once: true });

    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("pointerdown", handler);
    };
  }, []);

  useEffect(() => {
    if (!game?.lastEvent?.id || previousEventId.current === game.lastEvent.id) {
      return;
    }

    previousEventId.current = game.lastEvent.id;
    if (audioContextRef.current) {
      playEventSound(audioContextRef.current, game.lastEvent.type);
    }

    const nextClass =
      game.lastEvent.type === "correct"
        ? "feedback-correct"
        : game.lastEvent.type === "wrong"
          ? "feedback-wrong"
          : game.lastEvent.type === "buzz"
            ? "feedback-buzz"
            : "feedback-round";

    setFeedbackClass(nextClass);
    const timeoutId = window.setTimeout(() => setFeedbackClass(""), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [game?.lastEvent]);

  useEffect(() => {
    const revealedAnswers =
      game?.round?.answers.filter((answer: any) => answer.revealed) ?? [];
    if (revealedAnswers.length <= previousRevealedCount.current) {
      previousRevealedCount.current = revealedAnswers.length;
      return;
    }

    const newestAnswer = revealedAnswers[revealedAnswers.length - 1];
    previousRevealedCount.current = revealedAnswers.length;
    setHighlightAnswerId(newestAnswer?.id ?? null);
    const timeoutId = window.setTimeout(() => setHighlightAnswerId(null), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [game?.round?.answers]);

  if (game === undefined) {
    return (
      <main
        className={`${panelClassName} flex min-h-[220px] items-center justify-center px-6 py-8 text-lg font-medium`}
      >
        Loading game…
      </main>
    );
  }

  if (game === null) {
    return (
      <main
        className={`${panelClassName} flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-10 text-center`}
      >
        <h2 className="text-2xl font-bold text-white">No round loaded</h2>
        <p className="max-w-xl text-pink-100/70">
          Open the admin page, save a round, then bring players back here to
          start buzzing.
        </p>
      </main>
    );
  }

  const round = game.round;
  const wrongGuesses = round?.wrongGuesses ?? [];
  const playerOneGuesses = wrongGuesses.filter(
    (guess: any) => guess.player === "player1",
  );
  const playerTwoGuesses = wrongGuesses.filter(
    (guess: any) => guess.player === "player2",
  );
  const playerOneName = game.playerOneName;
  const playerTwoName = game.playerTwoName;

  return round ? (
    <main
      className={`grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden ${feedbackClasses[feedbackClass] ?? ""}`}
    >
      <section className="grid gap-3 xl:grid-cols-[minmax(0,2.25fr)_190px]">
        <section className={`${panelClassName} px-4 py-4 sm:px-5`}>
          <p className="max-w-6xl text-3xl font-extrabold leading-[1.08] text-pink-50 sm:text-4xl xl:text-[3.3rem]">
            {round.prompt}
          </p>
        </section>

        <section className="grid gap-3 xl:grid-rows-2">
          <article
            className={`${panelClassName} ${softPanelClassName} px-3 py-2.5`}
          >
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-pink-200/70 sm:text-xs">
              {game.playerOneName}
            </p>
            <strong className="mt-1 block text-3xl font-extrabold leading-none text-white sm:text-4xl">
              {game.scores.player1}
            </strong>
            <span className="mt-1.5 inline-flex rounded-full border border-pink-300/25 bg-pink-500/10 px-2.5 py-0.5 text-[0.68rem] text-pink-100 sm:text-xs">
              Key {game.playerOneKey}
            </span>
          </article>
          <article
            className={`${panelClassName} ${softPanelClassName} px-3 py-2.5`}
          >
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-pink-200/70 sm:text-xs">
              {game.playerTwoName}
            </p>
            <strong className="mt-1 block text-3xl font-extrabold leading-none text-white sm:text-4xl">
              {game.scores.player2}
            </strong>
            <span className="mt-1.5 inline-flex rounded-full border border-pink-300/25 bg-pink-500/10 px-2.5 py-0.5 text-[0.68rem] text-pink-100 sm:text-xs">
              Key {game.playerTwoKey}
            </span>
          </article>
        </section>
      </section>

      <section className="grid min-h-0 auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {round.answers.map((answer: any, index: number) => (
          <article
            className={[
              "relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[24px] border px-4 py-4 transition xl:min-h-[260px] xl:px-5 xl:py-5",
              answer.revealed
                ? "border-pink-300/25 bg-[linear-gradient(180deg,rgba(255,53,146,0.26),rgba(18,4,13,0.96))] text-white"
                : "border-white/8 bg-[linear-gradient(180deg,rgba(22,8,18,0.94),rgba(8,3,7,0.98))] text-pink-100/82",
              answer.id === highlightAnswerId
                ? "scale-[1.02] shadow-[0_0_0_1px_rgba(255,123,192,0.18),0_0_40px_rgba(255,84,169,0.18)]"
                : "",
            ].join(" ")}
            key={answer.id}
          >
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.22em] text-pink-200/60 sm:text-[0.9rem]">
              Answer {index + 1}
            </span>
            {answer.revealed ? (
              <div className="mt-4 flex h-full items-end justify-between gap-3">
                <strong className="text-2xl font-bold leading-tight sm:text-[2rem] xl:text-[2.4rem]">
                  {answer.text}
                </strong>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xl font-bold text-pink-50 xl:text-2xl">
                  {answer.points}
                </span>
              </div>
            ) : (
              <strong className="mt-6 text-center text-7xl font-black text-pink-100/80 sm:text-8xl">
                ?
              </strong>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-2 md:grid-cols-2">
        <article className={`${panelClassName} px-4 py-3`}>
          <p className={eyebrowClassName}>{playerOneName} Strikes</p>
          <div className="mt-2 grid gap-2">
            <div
              className="flex gap-2"
              aria-label={`${round.strikes.player1} strikes`}
            >
              {Array.from({ length: 3 }, (_, index) => (
                <span
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-2xl border text-base font-bold transition sm:h-12 sm:w-12 sm:text-lg",
                    index < round.strikes.player1
                      ? "border-pink-300/40 bg-pink-500/20 text-pink-100"
                      : "border-white/10 bg-white/5 text-pink-100/35",
                  ].join(" ")}
                  key={index}
                >
                  X
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {playerOneGuesses.length === 0 ? (
                <span className="text-sm text-pink-100/60">No misses yet.</span>
              ) : (
                playerOneGuesses.map((guess: any) => (
                  <span
                    className="rounded-full border border-pink-300/20 bg-pink-500/10 px-3 py-1 text-xs text-pink-50 sm:text-sm"
                    key={guess.id}
                  >
                    {guess.guess}
                  </span>
                ))
              )}
            </div>
          </div>
        </article>
        <article className={`${panelClassName} px-4 py-3`}>
          <p className={eyebrowClassName}>{playerTwoName} Strikes</p>
          <div className="mt-2 grid gap-2">
            <div
              className="flex gap-2"
              aria-label={`${round.strikes.player2} strikes`}
            >
              {Array.from({ length: 3 }, (_, index) => (
                <span
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-2xl border text-base font-bold transition sm:h-12 sm:w-12 sm:text-lg",
                    index < round.strikes.player2
                      ? "border-pink-300/40 bg-pink-500/20 text-pink-100"
                      : "border-white/10 bg-white/5 text-pink-100/35",
                  ].join(" ")}
                  key={index}
                >
                  X
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {playerTwoGuesses.length === 0 ? (
                <span className="text-sm text-pink-100/60">No misses yet.</span>
              ) : (
                playerTwoGuesses.map((guess: any) => (
                  <span
                    className="rounded-full border border-pink-300/20 bg-pink-500/10 px-3 py-1 text-xs text-pink-50 sm:text-sm"
                    key={guess.id}
                  >
                    {guess.guess}
                  </span>
                ))
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  ) : (
    <main
      className={`${panelClassName} flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-10 text-center`}
    >
      <h2 className="text-2xl font-bold text-white">No active round</h2>
      <p className="max-w-xl text-pink-100/70">
        Set up rounds in admin and send one live to start the game.
      </p>
    </main>
  );
}
