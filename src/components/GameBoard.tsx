import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { keyMatches } from "../lib/formatting";

const panelClassName =
  "rounded-[24px] border-2 border-black/80 bg-[#f6e8d5] shadow-[0_10px_24px_rgba(0,0,0,0.15)]";
const softPanelClassName =
  "rounded-[20px] border border-black/20 bg-white/70";
const eyebrowClassName =
  "text-[0.72rem] uppercase tracking-[0.28em] text-slate-700";
const feedbackClasses: Record<string, string> = {
  "": "",
  "feedback-correct":
    "shadow-[0_0_0_1px_rgba(244,114,182,0.2),0_0_45px_rgba(244,114,182,0.2)]",
  "feedback-wrong":
    "shadow-[0_0_0_1px_rgba(248,113,113,0.2),0_0_40px_rgba(248,113,113,0.16)]",
  "feedback-buzz":
    "shadow-[0_0_0_1px_rgba(125,211,252,0.25),0_0_45px_rgba(125,211,252,0.22)]",
  "feedback-round":
    "shadow-[0_0_0_1px_rgba(244,114,182,0.16),0_0_35px_rgba(244,114,182,0.16)]",
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

function isTriggerActive(
  gamepad: Gamepad,
  buttonIndex: number,
  axisIndex: number | null,
  threshold: number,
) {
  const button = gamepad.buttons[buttonIndex];
  if (button) {
    if (button.pressed) {
      return true;
    }

    if (typeof button.value === "number" && button.value >= threshold) {
      return true;
    }
  }

  if (axisIndex !== null) {
    const axisValue = gamepad.axes[axisIndex];
    if (typeof axisValue === "number" && axisValue >= threshold) {
      return true;
    }
  }

  return false;
}

export function GameBoard() {
  const game = useQuery(api.game.current, {}) as any;
  const registerBuzz = useMutation(api.game.registerBuzz);
  const pressedKeys = useRef(new Set<string>());
  const pressedGamepadButtons = useRef(new Set<string>());
  const boardRef = useRef<HTMLElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousEventId = useRef<string | null>(null);
  const previousRevealedCount = useRef(0);
  const [feedbackClass, setFeedbackClass] = useState("");
  const [highlightAnswerId, setHighlightAnswerId] = useState<string | null>(
    null,
  );
  const [buzzToast, setBuzzToast] = useState<string | null>(null);

  useEffect(() => {
    const focusBoard = () => {
      boardRef.current?.focus();
    };

    focusBoard();
    window.addEventListener("focus", focusBoard);
    window.addEventListener("pointerdown", focusBoard);

    return () => {
      window.removeEventListener("focus", focusBoard);
      window.removeEventListener("pointerdown", focusBoard);
    };
  }, []);

  useEffect(() => {
    if (!game) {
      return;
    }

    const getBuzzTimestamp = () =>
      typeof window !== "undefined" && window.performance
        ? window.performance.timeOrigin + window.performance.now()
        : Date.now();

    const submitBuzz = (player: "player1" | "player2") => {
      void registerBuzz({ player, pressedAt: getBuzzTimestamp() });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        boardRef.current?.focus();
      }
    };

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
        submitBuzz("player1");
      }

      if (keyMatches(key, game.playerTwoKey)) {
        submitBuzz("player2");
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key.toUpperCase());
    };

    let pollIntervalId: number | null = null;
    const triggerThreshold = 0.5;
    const triggerMappings = [
      { buttonIndex: 7, axisIndex: 5, player: "player1" as const },
      { buttonIndex: 6, axisIndex: 4, player: "player2" as const },
    ];

    const readGamepads = () => {
      const gamepads = navigator.getGamepads?.() ?? [];
      const nextPressedButtons = new Set<string>();

      for (const gamepad of gamepads) {
        if (!gamepad) {
          continue;
        }

        for (const mapping of triggerMappings) {
          const isPressed = isTriggerActive(
            gamepad,
            mapping.buttonIndex,
            mapping.axisIndex,
            triggerThreshold,
          );
          const pressedId = `${gamepad.index}:${mapping.buttonIndex}`;

          if (isPressed) {
            nextPressedButtons.add(pressedId);
            if (!pressedGamepadButtons.current.has(pressedId)) {
              submitBuzz(mapping.player);
            }
          }
        }
      }

      pressedGamepadButtons.current = nextPressedButtons;
    };

    const startPollingGamepads = () => {
      if (pollIntervalId !== null) {
        return;
      }

      readGamepads();
      pollIntervalId = window.setInterval(readGamepads, 16);
    };

    const stopPollingGamepads = () => {
      if (pollIntervalId === null) {
        return;
      }

      window.clearInterval(pollIntervalId);
      pollIntervalId = null;
    };

    const handleGamepadConnected = () => {
      boardRef.current?.focus();
      startPollingGamepads();
    };

    const handleWindowBlur = () => {
      pressedKeys.current.clear();
      pressedGamepadButtons.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("focus", startPollingGamepads);
    window.addEventListener("blur", handleWindowBlur);
    startPollingGamepads();

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
      window.removeEventListener("focus", startPollingGamepads);
      window.removeEventListener("blur", handleWindowBlur);
      stopPollingGamepads();
      pressedGamepadButtons.current.clear();
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
    if (game.lastEvent.type === "buzz") {
      const nextBuzzToast =
        game.lastEvent.player === "player1"
          ? `${game.playerOneName} buzzed in first`
          : game.lastEvent.player === "player2"
            ? `${game.playerTwoName} buzzed in first`
            : game.lastEvent.title;
      setBuzzToast(nextBuzzToast);
      const toastTimeoutId = window.setTimeout(() => setBuzzToast(null), 2200);
      if (audioContextRef.current) {
        playEventSound(audioContextRef.current, game.lastEvent.type);
      }

      const nextClass = "feedback-buzz";
      setFeedbackClass(nextClass);
      const timeoutId = window.setTimeout(() => setFeedbackClass(""), 1200);

      return () => {
        window.clearTimeout(toastTimeoutId);
        window.clearTimeout(timeoutId);
      };
    }

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
        ref={boardRef}
        tabIndex={-1}
        className={`${panelClassName} flex min-h-[220px] items-center justify-center px-6 py-8 text-lg font-medium outline-none focus:outline-none`}
      >
        Loading game…
      </main>
    );
  }

  if (game === null) {
    return (
      <main
        ref={boardRef}
        tabIndex={-1}
        className={`${panelClassName} flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-10 text-center outline-none focus:outline-none`}
      >
        <h2 className="text-2xl font-bold text-slate-900">No round loaded</h2>
        <p className="max-w-xl text-slate-700">
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
      ref={boardRef}
      tabIndex={-1}
      className={`grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden outline-none focus:outline-none ${feedbackClasses[feedbackClass] ?? ""}`}
    >
      {buzzToast ? (
        <section className="pointer-events-none fixed left-1/2 top-6 z-20 w-[min(92vw,34rem)] -translate-x-1/2 rounded-[24px] border-2 border-black/80 bg-[#fdf1de] px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-slate-700">
            Buzzer Alert
          </p>
          <strong className="mt-1 block text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {buzzToast}
          </strong>
        </section>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-[minmax(0,2.25fr)_190px]">
        <section className={`${panelClassName} px-4 py-4 sm:px-5`}>
          <p className="max-w-6xl text-3xl font-extrabold leading-[1.08] text-slate-900 sm:text-4xl xl:text-[3.3rem]">
            {round.prompt}
          </p>
        </section>

        <section className="grid gap-3 xl:grid-rows-2">
          <article
            className={`${panelClassName} ${softPanelClassName} px-3 py-2.5`}
          >
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-slate-600 sm:text-xs">
              {game.playerOneName}
            </p>
            <strong className="mt-1 block text-3xl font-extrabold leading-none text-slate-900 sm:text-4xl">
              {game.scores.player1}
            </strong>
            <span className="mt-1.5 inline-flex rounded-full border border-pink-300/25 bg-pink-500/10 px-2.5 py-0.5 text-[0.68rem] text-pink-100 sm:text-xs">
              Key {game.playerOneKey} / R2
            </span>
          </article>
          <article
            className={`${panelClassName} ${softPanelClassName} px-3 py-2.5`}
          >
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-slate-600 sm:text-xs">
              {game.playerTwoName}
            </p>
            <strong className="mt-1 block text-3xl font-extrabold leading-none text-slate-900 sm:text-4xl">
              {game.scores.player2}
            </strong>
            <span className="mt-1.5 inline-flex rounded-full border border-pink-300/25 bg-pink-500/10 px-2.5 py-0.5 text-[0.68rem] text-pink-100 sm:text-xs">
              Key {game.playerTwoKey} / L2
            </span>
          </article>
        </section>
      </section>

      <section className="grid min-h-0 auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {round.answers.map((answer: any, index: number) => (
          <article
            className={[
              "relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-[24px] border-4 border-black px-4 py-4 text-black transition xl:min-h-[200px] xl:px-5 xl:py-5",
              index % 2 === 0 ? "bg-pink-200" : "bg-sky-200",
              answer.id === highlightAnswerId
                ? "scale-[1.02] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_30px_rgba(0,0,0,0.22)]"
                : "",
            ].join(" ")}
            key={answer.id}
          >
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.22em] text-black/70 sm:text-[0.9rem]">
              Answer {index + 1}
            </span>
            {answer.revealed ? (
              <div className="mt-4 flex h-full items-end justify-between gap-3">
                <strong className="text-[1.35rem] font-bold leading-tight sm:text-[1.55rem] xl:text-[1.85rem]">
                  {answer.text}
                </strong>
                <span className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-xl font-bold text-black xl:text-2xl">
                  {answer.points}
                </span>
              </div>
            ) : (
              <strong className="mt-6 text-center text-7xl font-black text-black/75 sm:text-8xl">
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
                      ? "border-black/50 bg-pink-200 text-slate-900"
                      : "border-black/20 bg-white/70 text-slate-500",
                  ].join(" ")}
                  key={index}
                >
                  X
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {playerOneGuesses.length === 0 ? (
                <span className="text-sm text-slate-600">No misses yet.</span>
              ) : (
                playerOneGuesses.map((guess: any) => (
                  <span
                    className="rounded-full border border-black/20 bg-pink-100 px-3 py-1 text-xs text-slate-900 sm:text-sm"
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
                      ? "border-black/50 bg-sky-200 text-slate-900"
                      : "border-black/20 bg-white/70 text-slate-500",
                  ].join(" ")}
                  key={index}
                >
                  X
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {playerTwoGuesses.length === 0 ? (
                <span className="text-sm text-slate-600">No misses yet.</span>
              ) : (
                playerTwoGuesses.map((guess: any) => (
                  <span
                    className="rounded-full border border-black/20 bg-sky-100 px-3 py-1 text-xs text-slate-900 sm:text-sm"
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
      className={`${panelClassName} flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-10 text-center outline-none focus:outline-none`}
    >
      <h2 className="text-2xl font-bold text-slate-900">No active round</h2>
      <p className="max-w-xl text-slate-700">
        Set up rounds in admin and send one live to start the game.
      </p>
    </main>
  );
}
