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
  const [selectedTeam, setSelectedTeam] = useState<"player1" | "player2">("player1");
  const [selectedRoundId, setSelectedRoundId] = useState(defaultMatch.rounds[0]?.id ?? "");

  useEffect(() => {
    if (game !== undefined) {
      setForm(toFormState(game));
      setSelectedRoundId(game?.rounds?.[game.currentRoundIndex]?.id ?? game?.rounds?.[0]?.id ?? "");
    }
  }, [game]);

  useEffect(() => {
    if (game?.buzz.player) {
      setSelectedTeam(game.buzz.player);
    }
  }, [game?.buzz.player]);

  const selectedRound = useMemo(
    () => form.rounds.find((round) => round.id === selectedRoundId) ?? form.rounds[0] ?? null,
    [form.rounds, selectedRoundId],
  );

  const updateSelectedRound = (updater: (round: EditableRound) => EditableRound) => {
    if (!selectedRound) {
      return;
    }

    setForm((current) => ({
      ...current,
      rounds: current.rounds.map((round) => (round.id === selectedRound.id ? updater(round) : round)),
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
    return <main className="panel">Loading admin…</main>;
  }

  const activeTeam = game?.buzz.player ?? selectedTeam;
  const liveRound = game?.round;

  return (
    <main className="admin-layout">
      <section className="panel control-stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Match Setup</p>
            <h2>Queue every round in advance</h2>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              setForm(defaultMatch);
              setSelectedRoundId(defaultMatch.rounds[0]?.id ?? "");
            }}
            type="button"
          >
            Load Sample
          </button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="two-column">
            <label>
              Player one name
              <input
                onChange={(event) => setForm((current) => ({ ...current, playerOneName: event.target.value }))}
                value={form.playerOneName}
              />
            </label>
            <label>
              Player one key
              <input
                maxLength={1}
                onChange={(event) => setForm((current) => ({ ...current, playerOneKey: event.target.value }))}
                value={form.playerOneKey}
              />
            </label>
            <label>
              Player two name
              <input
                onChange={(event) => setForm((current) => ({ ...current, playerTwoName: event.target.value }))}
                value={form.playerTwoName}
              />
            </label>
            <label>
              Player two key
              <input
                maxLength={1}
                onChange={(event) => setForm((current) => ({ ...current, playerTwoKey: event.target.value }))}
                value={form.playerTwoKey}
              />
            </label>
          </div>

          <div className="round-planner">
            <div className="section-heading">
              <h3>Round Queue</h3>
              <button
                className="secondary-button"
                onClick={() =>
                  setForm((current) => {
                    const nextRoundItem = createEmptyRound(current.rounds.length);
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

            <div className="round-list">
              {form.rounds.map((round, index) => (
                <button
                  className={round.id === selectedRound?.id ? "round-chip active" : "round-chip"}
                  key={round.id}
                  onClick={() => setSelectedRoundId(round.id)}
                  type="button"
                >
                  <strong>{index + 1}</strong>
                  <span>{round.title || `Round ${index + 1}`}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedRound ? (
            <div className="round-editor-card">
              <label>
                Round title
                <input
                  onChange={(event) => updateSelectedRound((round) => ({ ...round, title: event.target.value }))}
                  value={selectedRound.title}
                />
              </label>
              <label>
                Prompt
                <textarea
                  onChange={(event) => updateSelectedRound((round) => ({ ...round, prompt: event.target.value }))}
                  rows={3}
                  value={selectedRound.prompt}
                />
              </label>

              <div className="section-heading">
                <h3>Answers</h3>
                <div className="team-selector">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      updateSelectedRound((round) => ({
                        ...round,
                        answers: [...round.answers, createEmptyAnswer(round.answers.length)],
                      }))
                    }
                    type="button"
                  >
                    Add Answer
                  </button>
                  {form.rounds.length > 1 ? (
                    <button
                      className="danger-button"
                      onClick={() => {
                        setForm((current) => {
                          const remainingRounds = current.rounds.filter((round) => round.id !== selectedRound.id);
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

              <div className="answer-editor-list">
                {selectedRound.answers.map((answer, index) => (
                  <div className="answer-editor" key={answer.id}>
                    <span>{index + 1}</span>
                    <input
                      onChange={(event) =>
                        updateSelectedRound((round) => ({
                          ...round,
                          answers: round.answers.map((item) =>
                            item.id === answer.id ? { ...item, text: event.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Answer text"
                      value={answer.text}
                    />
                    <input
                      min={0}
                      onChange={(event) =>
                        updateSelectedRound((round) => ({
                          ...round,
                          answers: round.answers.map((item) =>
                            item.id === answer.id ? { ...item, points: Number(event.target.value) } : item,
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

          <button className="primary-button" type="submit">
            Save Match
          </button>
        </form>
      </section>

      <section className="panel control-stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live Control</p>
            <h2>Tap from your phone</h2>
          </div>
          <button className="secondary-button" onClick={() => void clearBuzz({})} type="button">
            Clear Buzz
          </button>
        </div>

        <div className="live-round-card">
          <p className="eyebrow">Current Round</p>
          <h3>
            {game ? `${game.currentRoundIndex + 1} / ${game.totalRounds}` : "No match"}
          </h3>
          <strong>{liveRound?.title ?? "No active round"}</strong>
          <p>{liveRound?.prompt ?? "Save a match to begin."}</p>
        </div>

        <div className="round-jump-list">
          {game?.rounds.map((round: any, index: number) => (
            <button
              className={index === game.currentRoundIndex ? "round-chip active" : "round-chip"}
              key={round.id}
              onClick={() => void jumpToRound({ roundIndex: index })}
              type="button"
            >
              <strong>{index + 1}</strong>
              <span>{round.title}</span>
            </button>
          ))}
        </div>

        <div className="live-status">
          <span className="status-pill live">{game?.buzz.player ? "Buzz Locked" : "Buzzers Open"}</span>
          <strong>
            {game?.buzz.player === "player1"
              ? game.playerOneName
              : game?.buzz.player === "player2"
                ? game.playerTwoName
                : "No player yet"}
          </strong>
        </div>

        <div className="team-selector">
          <button
            className={activeTeam === "player1" ? "secondary-button selected-team" : "secondary-button"}
            onClick={() => setSelectedTeam("player1")}
            type="button"
          >
            Award {game?.playerOneName ?? "Player One"}
          </button>
          <button
            className={activeTeam === "player2" ? "secondary-button selected-team" : "secondary-button"}
            onClick={() => setSelectedTeam("player2")}
            type="button"
          >
            Award {game?.playerTwoName ?? "Player Two"}
          </button>
        </div>

        <div className="reveal-grid">
          {liveRound?.answers.map((answer: any) => (
              <button
                className={answer.revealed ? "answer-toggle revealed" : "answer-toggle"}
                disabled={answer.revealed}
                key={answer.id}
                onClick={() => void revealAnswer({ answerId: answer.id, player: activeTeam })}
                type="button"
              >
                <span>{answer.text}</span>
                <strong>{answer.points}</strong>
              </button>
          ))}
        </div>

        <button
          className="danger-button"
          onClick={() => void markWrongGuess({ player: activeTeam })}
          type="button"
        >
          Reject Answer
        </button>

        <div className="strike-manager">
          <button className="secondary-button" onClick={() => void adjustStrikes({ player: activeTeam, delta: -1 })} type="button">
            Remove Strike
          </button>
          <button className="secondary-button" onClick={() => void adjustStrikes({ player: activeTeam, delta: 1 })} type="button">
            Add Strike
          </button>
        </div>

        <div className="admin-actions">
          <button className="secondary-button" onClick={() => void nextRound({})} type="button">
            Next Round
          </button>
          <button className="secondary-button" onClick={() => void resetRound({})} type="button">
            Reset Round
          </button>
          <button className="secondary-button" onClick={() => void resetScores({})} type="button">
            Reset Scores
          </button>
        </div>
      </section>
    </main>
  );
}
