import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { keyMatches } from "../lib/formatting";

function playTone(context: AudioContext, frequency: number, duration: number, gainValue: number, type: OscillatorType) {
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
  const [highlightAnswerId, setHighlightAnswerId] = useState<string | null>(null);

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
    const revealedAnswers = game?.round?.answers.filter((answer: any) => answer.revealed) ?? [];
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
    return <main className="panel">Loading game…</main>;
  }

  if (game === null) {
    return (
      <main className="panel empty-state">
        <h2>No round loaded</h2>
        <p>Open the admin page, save a round, then bring players back here to start buzzing.</p>
      </main>
    );
  }

  const round = game.round;
  const buzzingPlayerName =
    game.buzz.player === "player1" ? game.playerOneName : game.buzz.player === "player2" ? game.playerTwoName : null;
  const wrongGuesses = round?.wrongGuesses ?? [];
  const playerOneGuesses = wrongGuesses.filter((guess: any) => guess.player === "player1");
  const playerTwoGuesses = wrongGuesses.filter((guess: any) => guess.player === "player2");
  const playerOneName = game.playerOneName;
  const playerTwoName = game.playerTwoName;

  return round ? (
    <main className={`board-layout ${feedbackClass}`}>
      <section className="board-top">
        <section className="hero panel">
          <p className="eyebrow">International Women's Day Feud</p>
          <div className="hero-meta">
            <span className="round-pill">
              Round {game.currentRoundIndex + 1} of {game.totalRounds}
            </span>
            <span className="event-pill">{game.lastEvent.title}</span>
          </div>
          <h2>{round.title}</h2>
          <p className="prompt">{round.prompt}</p>
          <div className="buzz-banner">
            {buzzingPlayerName ? (
              <>
                <span className="status-pill live">Buzzed First</span>
                <strong>{buzzingPlayerName}</strong>
              </>
            ) : (
              <>
                <span className="status-pill">Buzzers Open</span>
                <strong>Waiting for a key press</strong>
              </>
            )}
          </div>
          <div className={`event-banner ${feedbackClass}`}>
            <strong>{game.lastEvent.title}</strong>
            <span>{game.lastEvent.detail}</span>
          </div>
        </section>

        <section className="score-row">
          <article className="panel score-card">
            <p>{game.playerOneName}</p>
            <strong>{game.scores.player1}</strong>
            <span>Key {game.playerOneKey}</span>
          </article>
          <article className="panel score-card">
            <p>{game.playerTwoName}</p>
            <strong>{game.scores.player2}</strong>
            <span>Key {game.playerTwoKey}</span>
          </article>
        </section>
      </section>

      <section className="answers-grid">
        {round.answers.map((answer: any, index: number) => (
          <article
            className={
              answer.revealed
                ? answer.id === highlightAnswerId
                  ? "answer-card revealed newly-revealed"
                  : "answer-card revealed"
                : "answer-card"
            }
            key={answer.id}
          >
            <span className="answer-rank">{index + 1}</span>
            {answer.revealed ? (
              <>
                <strong>{answer.text}</strong>
                <span>{answer.points}</span>
              </>
            ) : (
              <strong>?</strong>
            )}
          </article>
        ))}
      </section>

      <section className="board-footer">
        <article className="panel">
          <p className="eyebrow">{playerOneName} Strikes</p>
          <div className="team-status">
            <div className="strikes" aria-label={`${round.strikes.player1} strikes`}>
              {Array.from({ length: 3 }, (_, index) => (
                <span className={index < round.strikes.player1 ? "strike active" : "strike"} key={index}>
                  X
                </span>
              ))}
            </div>
            <div className="guess-list">
              {playerOneGuesses.length === 0 ? (
                <span>No misses yet.</span>
              ) : (
                playerOneGuesses.map((guess: any) => (
                  <span className="guess-chip" key={guess.id}>
                    {guess.guess}
                  </span>
                ))
              )}
            </div>
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">{playerTwoName} Strikes</p>
          <div className="team-status">
            <div className="strikes" aria-label={`${round.strikes.player2} strikes`}>
              {Array.from({ length: 3 }, (_, index) => (
                <span className={index < round.strikes.player2 ? "strike active" : "strike"} key={index}>
                  X
                </span>
              ))}
            </div>
            <div className="guess-list">
              {playerTwoGuesses.length === 0 ? (
                <span>No misses yet.</span>
              ) : (
                playerTwoGuesses.map((guess: any) => (
                  <span className="guess-chip" key={guess.id}>
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
    <main className="panel empty-state">
      <h2>No active round</h2>
      <p>Set up rounds in admin and send one live to start the game.</p>
    </main>
  );
}
