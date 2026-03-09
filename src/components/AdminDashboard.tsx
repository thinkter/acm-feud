import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  createEmptyAnswer,
  createEmptyRound,
  defaultMatch,
  type EditableMatch,
  type EditableRound,
} from "../lib/defaultGame";
import { normalizeKeyLabel } from "../lib/formatting";

const panelClassName =
  "rounded-[24px] border-2 border-black/80 bg-[#f6e8d5] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.15)]";
const insetCardClassName =
  "rounded-[20px] border border-black/20 bg-white/70 p-4";
const eyebrowClassName =
  "text-[0.72rem] uppercase tracking-[0.28em] text-slate-600";
const fieldClassName =
  "w-full rounded-2xl border border-black/20 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-pink-300";
const stackedFieldClassName = `mt-2 ${fieldClassName}`;
const secondaryButtonClassName =
  "rounded-full border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-pink-300 hover:bg-pink-100";
const dangerButtonClassName =
  "rounded-full border border-red-300 bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-900 transition hover:-translate-y-0.5 hover:bg-red-200";
const primaryButtonClassName =
  "rounded-full border border-black/30 bg-pink-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-pink-200";

function toFormState(game: any): EditableMatch {
  if (!game) {
    return defaultMatch;
  }

  return {
    playerOneName: game.playerOneName,
    playerTwoName: game.playerTwoName,
    playerOneKey: game.playerOneKey,
    playerTwoKey: game.playerTwoKey,
    rounds: game.rounds.map((round: any) => ({
      id: round.id,
      title: round.title,
      prompt: round.prompt,
      answers: round.answers.map((answer: any) => ({
        id: answer.id,
        text: answer.text,
        points: answer.points,
      })),
    })),
  };
}

export function AdminDashboard() {
  const game = useQuery(api.game.current, {}) as any;
  const saveGame = useMutation(api.game.createOrReset);
  const revealAnswer = useMutation(api.game.revealAnswer);
  const markWrongGuess = useMutation(api.game.markWrongGuess);
  const clearBuzz = useMutation(api.game.clearBuzz);
  const adjustStrikes = useMutation(api.game.adjustStrikes);
  const jumpToRound = useMutation(api.game.jumpToRound);
  const nextRound = useMutation(api.game.nextRound);
  const resetRound = useMutation(api.game.resetRound);
  const resetScores = useMutation(api.game.resetScores);
  const [form, setForm] = useState<EditableMatch>(defaultMatch);
  const [selectedTeam, setSelectedTeam] = useState<"player1" | "player2">(
    "player1",
  );
  const [selectedRoundId, setSelectedRoundId] = useState(
    defaultMatch.rounds[0]?.id ?? "",
  );

  useEffect(() => {
    if (game !== undefined) {
      setForm(toFormState(game));
      setSelectedRoundId(
        game?.rounds?.[game.currentRoundIndex]?.id ??
          game?.rounds?.[0]?.id ??
          "",
      );
    }
  }, [game]);

  useEffect(() => {
    if (game?.buzz.player) {
      setSelectedTeam(game.buzz.player);
    }
  }, [game?.buzz.player]);

  const selectedRound = useMemo(
    () =>
      form.rounds.find((round) => round.id === selectedRoundId) ??
      form.rounds[0] ??
      null,
    [form.rounds, selectedRoundId],
  );

  const updateSelectedRound = (
    updater: (round: EditableRound) => EditableRound,
  ) => {
    if (!selectedRound) {
      return;
    }

    setForm((current) => ({
      ...current,
      rounds: current.rounds.map((round) =>
        round.id === selectedRound.id ? updater(round) : round,
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playerOneKey = normalizeKeyLabel(form.playerOneKey);
    const playerTwoKey = normalizeKeyLabel(form.playerTwoKey);

    if (!playerOneKey || !playerTwoKey) {
      window.alert("Both players need a buzzer key.");
      return;
    }

    if (playerOneKey === playerTwoKey) {
      window.alert("Choose different buzzer keys for each player.");
      return;
    }

    const rounds = form.rounds
      .map((round, roundIndex) => ({
        id: round.id,
        title: round.title.trim() || `Round ${roundIndex + 1}`,
        prompt: round.prompt.trim(),
        answers: round.answers
          .filter((answer) => answer.text.trim().length > 0)
          .map((answer, answerIndex) => ({
            id: answer.id || `answer-${answerIndex + 1}`,
            text: answer.text.trim(),
            points: Number(answer.points) || 0,
          })),
      }))
      .filter((round) => round.prompt.length > 0 && round.answers.length > 0);

    if (rounds.length === 0) {
      window.alert("Add at least one round with a prompt and one answer.");
      return;
    }

    await saveGame({
      playerOneName: form.playerOneName,
      playerTwoName: form.playerTwoName,
      playerOneKey,
      playerTwoKey,
      rounds,
    });
  };

  if (game === undefined) {
    return (
      <main
        className={`${panelClassName} flex min-h-[220px] items-center justify-center text-lg font-medium`}
      >
        Loading admin...
      </main>
    );
  }

  const activeTeam = game?.buzz.player ?? selectedTeam;
  const liveRound = game?.round;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className={`${panelClassName} grid min-w-0 gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={eyebrowClassName}>Match Setup</p>
            <h2 className="text-2xl font-bold text-slate-900">
              Queue every round in advance
            </h2>
          </div>
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setForm(defaultMatch);
              setSelectedRoundId(defaultMatch.rounds[0]?.id ?? "");
            }}
            type="button"
          >
            Load Sample
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-800">
              Player one name
              <input
                className={stackedFieldClassName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    playerOneName: event.target.value,
                  }))
                }
                value={form.playerOneName}
              />
            </label>
            <label className="text-sm font-medium text-slate-800">
              Player one key
              <input
                className={stackedFieldClassName}
                maxLength={1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    playerOneKey: event.target.value,
                  }))
                }
                value={form.playerOneKey}
              />
            </label>
            <label className="text-sm font-medium text-slate-800">
              Player two name
              <input
                className={stackedFieldClassName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    playerTwoName: event.target.value,
                  }))
                }
                value={form.playerTwoName}
              />
            </label>
            <label className="text-sm font-medium text-slate-800">
              Player two key
              <input
                className={stackedFieldClassName}
                maxLength={1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    playerTwoKey: event.target.value,
                  }))
                }
                value={form.playerTwoKey}
              />
            </label>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-slate-900">Round Queue</h3>
              <button
                className={secondaryButtonClassName}
                onClick={() =>
                  setForm((current) => {
                    const nextRoundItem = createEmptyRound(
                      current.rounds.length,
                    );
                    setSelectedRoundId(nextRoundItem.id);
                    return {
                      ...current,
                      rounds: [...current.rounds, nextRoundItem],
                    };
                  })
                }
                type="button"
              >
                Add Round
              </button>
            </div>

            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {form.rounds.map((round, index) => (
                <button
                  className={[
                    "flex min-w-[150px] shrink-0 items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition",
                    round.id === selectedRound?.id
                      ? "border-black/35 bg-pink-200 text-slate-900 shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                      : "border-black/20 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-100",
                  ].join(" ")}
                  key={round.id}
                  onClick={() => setSelectedRoundId(round.id)}
                  type="button"
                >
                  <strong className="text-lg">{index + 1}</strong>
                  <span className="text-sm font-medium">
                    {round.title || `Round ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedRound ? (
            <div className={`${insetCardClassName} grid gap-4`}>
              <label className="text-sm font-medium text-slate-800">
                Round title
                <input
                  className={stackedFieldClassName}
                  onChange={(event) =>
                    updateSelectedRound((round) => ({
                      ...round,
                      title: event.target.value,
                    }))
                  }
                  value={selectedRound.title}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                Prompt
                <textarea
                  className={`${stackedFieldClassName} min-h-28 resize-y`}
                  onChange={(event) =>
                    updateSelectedRound((round) => ({
                      ...round,
                      prompt: event.target.value,
                    }))
                  }
                  rows={3}
                  value={selectedRound.prompt}
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-slate-900">Answers</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={secondaryButtonClassName}
                    onClick={() =>
                      updateSelectedRound((round) => ({
                        ...round,
                        answers: [
                          ...round.answers,
                          createEmptyAnswer(round.answers.length),
                        ],
                      }))
                    }
                    type="button"
                  >
                    Add Answer
                  </button>
                  {form.rounds.length > 1 ? (
                    <button
                      className={dangerButtonClassName}
                      onClick={() => {
                        setForm((current) => {
                          const remainingRounds = current.rounds.filter(
                            (round) => round.id !== selectedRound.id,
                          );
                          setSelectedRoundId(remainingRounds[0]?.id ?? "");
                          return {
                            ...current,
                            rounds: remainingRounds,
                          };
                        });
                      }}
                      type="button"
                    >
                      Remove Round
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3">
                {selectedRound.answers.map((answer, index) => (
                  <div
                    className="grid gap-3 rounded-[20px] border border-black/20 bg-white/80 p-3 md:grid-cols-[56px_minmax(0,1fr)_120px]"
                    key={answer.id}
                  >
                    <span className="flex h-12 items-center justify-center rounded-2xl bg-pink-200 text-lg font-bold text-slate-900">
                      {index + 1}
                    </span>
                    <input
                      className={fieldClassName}
                      onChange={(event) =>
                        updateSelectedRound((round) => ({
                          ...round,
                          answers: round.answers.map((item) =>
                            item.id === answer.id
                              ? { ...item, text: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Answer text"
                      value={answer.text}
                    />
                    <input
                      className={fieldClassName}
                      min={0}
                      onChange={(event) =>
                        updateSelectedRound((round) => ({
                          ...round,
                          answers: round.answers.map((item) =>
                            item.id === answer.id
                              ? { ...item, points: Number(event.target.value) }
                              : item,
                          ),
                        }))
                      }
                      type="number"
                      value={answer.points}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button className={primaryButtonClassName} type="submit">
            Save Match
          </button>
        </form>
      </div>

      <section
        className={`${panelClassName} grid w-full gap-4 xl:sticky xl:top-3`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={eyebrowClassName}>Live Control</p>
            <h2 className="text-2xl font-bold text-slate-900">
              Tap from your phone
            </h2>
          </div>
          <button
            className={secondaryButtonClassName}
            onClick={() => void clearBuzz({})}
            type="button"
          >
            Clear Buzz
          </button>
        </div>

        <div className={insetCardClassName}>
          <p className={eyebrowClassName}>Current Round</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {game
              ? `${game.currentRoundIndex + 1} / ${game.totalRounds}`
              : "No match"}
          </h3>
          <strong className="mt-3 block text-lg text-slate-900">
            {liveRound?.title ?? "No active round"}
          </strong>
          <p className="mt-2 text-slate-700">
            {liveRound?.prompt ?? "Save a match to begin."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {game?.rounds.map((round: any, index: number) => (
            <button
              className={[
                "flex min-w-[110px] items-center gap-2 rounded-[20px] border px-3 py-2.5 text-left text-sm transition",
                index === game.currentRoundIndex
                  ? "border-black/35 bg-sky-200 text-slate-900"
                  : "border-black/20 bg-white text-slate-800 hover:border-pink-300 hover:bg-pink-100",
              ].join(" ")}
              key={round.id}
              onClick={() => void jumpToRound({ roundIndex: index })}
              type="button"
            >
              <strong>{index + 1}</strong>
              <span>{round.title}</span>
            </button>
          ))}
        </div>

        <div
          className={`${insetCardClassName} flex flex-wrap items-center gap-3`}
        >
          <span className="rounded-full border border-black/20 bg-pink-100 px-3 py-1.5 text-sm font-semibold text-slate-900">
            {game?.buzz.player ? "Buzz Locked" : "Buzzers Open"}
          </span>
          <strong className="text-slate-900">
            {game?.buzz.player === "player1"
              ? game.playerOneName
              : game?.buzz.player === "player2"
                ? game.playerTwoName
                : "No player yet"}
          </strong>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className={
              activeTeam === "player1"
                ? `${secondaryButtonClassName} border-black/35 bg-pink-200`
                : secondaryButtonClassName
            }
            onClick={() => setSelectedTeam("player1")}
            type="button"
          >
            Award {game?.playerOneName ?? "Player One"}
          </button>
          <button
            className={
              activeTeam === "player2"
                ? `${secondaryButtonClassName} border-black/35 bg-sky-200`
                : secondaryButtonClassName
            }
            onClick={() => setSelectedTeam("player2")}
            type="button"
          >
            Award {game?.playerTwoName ?? "Player Two"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {liveRound?.answers.map((answer: any) => (
            <button
              className={[
                "flex items-center justify-between gap-3 rounded-[20px] border px-4 py-3 text-left transition",
                answer.revealed
                  ? "border-black/20 bg-pink-100 text-slate-600"
                  : "border-black/20 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-100",
              ].join(" ")}
              disabled={answer.revealed}
              key={answer.id}
              onClick={() =>
                void revealAnswer({ answerId: answer.id, player: activeTeam })
              }
              type="button"
            >
              <span>{answer.text}</span>
              <strong>{answer.points}</strong>
            </button>
          ))}
        </div>

        <button
          className={dangerButtonClassName}
          onClick={() => void markWrongGuess({ player: activeTeam })}
          type="button"
        >
          Reject Answer
        </button>

        <div className="flex flex-wrap gap-3">
          <button
            className={secondaryButtonClassName}
            onClick={() =>
              void adjustStrikes({ player: activeTeam, delta: -1 })
            }
            type="button"
          >
            Remove Strike
          </button>
          <button
            className={secondaryButtonClassName}
            onClick={() => void adjustStrikes({ player: activeTeam, delta: 1 })}
            type="button"
          >
            Add Strike
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className={secondaryButtonClassName}
            onClick={() => void nextRound({})}
            type="button"
          >
            Next Round
          </button>
          <button
            className={secondaryButtonClassName}
            onClick={() => void resetRound({})}
            type="button"
          >
            Reset Round
          </button>
          <button
            className={secondaryButtonClassName}
            onClick={() => void resetScores({})}
            type="button"
          >
            Reset Scores
          </button>
        </div>
      </section>
    </div>
  );
}
