import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

type Player = "player1" | "player2";

async function getCurrentGame(ctx: any) {
  return await ctx.db.query("games").first();
}

function createEvent(
  type: "correct" | "wrong" | "round" | "buzz",
  title: string,
  detail: string,
  player: Player | null = null,
) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    detail,
    player,
    createdAt: Date.now(),
  };
}

function currentRound(game: any) {
  return game.rounds[game.currentRoundIndex] ?? null;
}

function playerName(game: any, player: Player) {
  return player === "player1" ? game.playerOneName : game.playerTwoName;
}

function normalizeLegacyGame(game: any) {
  if (game.rounds && game.currentRoundIndex !== undefined && game.lastEvent) {
    return game;
  }

  const legacyWrongGuesses = Array.isArray(game.wrongGuesses) ? game.wrongGuesses : [];
  const playerTwoStrikeCount = typeof game.strikes === "number" ? Math.max(0, Math.min(3, game.strikes)) : 0;
  const normalizedRound = {
    id: game.title ? `legacy-${String(game.title).toLowerCase().replace(/\s+/g, "-")}` : "legacy-round-1",
    title: game.title ?? "Legacy Round",
    prompt: game.prompt ?? "",
    answers: Array.isArray(game.answers) ? game.answers : [],
    wrongGuesses: legacyWrongGuesses.map((guess: any, index: number) => ({
      id: guess.id ?? `legacy-wrong-${index + 1}`,
      player: guess.player === "player1" ? "player1" : "player2",
      playerName:
        guess.playerName ??
        (guess.player === "player1" ? game.playerOneName : game.playerTwoName ?? game.playerOneName),
      guess: guess.guess ?? "",
      strikeNumber: typeof guess.strikeNumber === "number" ? guess.strikeNumber : Math.min(index + 1, 3),
    })),
    strikes: {
      player1: 0,
      player2: playerTwoStrikeCount,
    },
  };

  return {
    ...game,
    currentRoundIndex: 0,
    rounds: [normalizedRound],
    lastEvent:
      game.lastEvent ??
      createEvent("round", "Legacy Match Imported", normalizedRound.title),
  };
}

async function getNormalizedGame(ctx: any) {
  const game = await getCurrentGame(ctx);
  if (!game) {
    return null;
  }

  return normalizeLegacyGame(game);
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    return {
      ...game,
      round: currentRound(game),
      totalRounds: game.rounds.length,
    };
  },
});

export const createOrReset = mutation({
  args: {
    playerOneName: v.string(),
    playerTwoName: v.string(),
    playerOneKey: v.string(),
    playerTwoKey: v.string(),
    rounds: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        prompt: v.string(),
        answers: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
            points: v.number(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existingGames = await ctx.db.query("games").collect();
    const primaryGame = existingGames[0] ?? null;

    if (existingGames.length > 1) {
      await Promise.all(existingGames.slice(1).map((game) => ctx.db.delete(game._id)));
    }

    const nextRounds = args.rounds.map((round) => ({
      id: round.id,
      title: round.title,
      prompt: round.prompt,
      answers: round.answers.map((answer) => ({
        ...answer,
        revealed: false,
      })),
      wrongGuesses: [],
      strikes: {
        player1: 0,
        player2: 0,
      },
    }));

    const nextState = {
      playerOneName: args.playerOneName,
      playerTwoName: args.playerTwoName,
      playerOneKey: args.playerOneKey.toUpperCase(),
      playerTwoKey: args.playerTwoKey.toUpperCase(),
      currentRoundIndex: 0,
      rounds: nextRounds,
      scores:
        primaryGame?.scores ?? {
          player1: 0,
          player2: 0,
        },
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent("round", "Match Ready", nextRounds[0]?.title ?? "No rounds configured"),
    };

    if (primaryGame) {
      await ctx.db.patch(primaryGame._id, nextState);
      return primaryGame._id;
    }

    return await ctx.db.insert("games", nextState);
  },
});

export const registerBuzz = mutation({
  args: {
    player: v.union(v.literal("player1"), v.literal("player2")),
    pressedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    const shouldReplaceCurrentBuzz =
      game.buzz.player === null || game.buzz.pressedAt === null || args.pressedAt < game.buzz.pressedAt;

    if (!shouldReplaceCurrentBuzz) {
      return game.buzz.player;
    }

    await ctx.db.patch(game._id, {
      buzz: {
        player: args.player,
        pressedAt: args.pressedAt,
      },
      lastEvent: createEvent("buzz", "Buzz In", `${playerName(game, args.player)} was first on the buzzer.`, args.player),
    });

    return args.player;
  },
});

export const revealAnswer = mutation({
  args: {
    answerId: v.string(),
    player: v.union(v.literal("player1"), v.literal("player2")),
  },
  handler: async (ctx, args) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    const round = currentRound(game);
    if (!round) {
      return null;
    }

    const answer = round.answers.find((item: any) => item.id === args.answerId);
    if (!answer || answer.revealed) {
      return null;
    }

    const nextRounds = game.rounds.map((item: any, index: number) =>
      index === game.currentRoundIndex
        ? {
            ...item,
            answers: item.answers.map((answerItem: any) =>
              answerItem.id === args.answerId ? { ...answerItem, revealed: true } : answerItem,
            ),
          }
        : item,
    );

    await ctx.db.patch(game._id, {
      rounds: nextRounds,
      scores: {
        ...game.scores,
        [args.player]: game.scores[args.player] + answer.points,
      },
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent(
        "correct",
        "Correct Answer",
        `${playerName(game, args.player)} earned ${answer.points} points for ${answer.text}.`,
        args.player,
      ),
    });

    return answer.points;
  },
});

export const markWrongGuess = mutation({
  args: {
    guess: v.optional(v.string()),
    player: v.union(v.literal("player1"), v.literal("player2")),
  },
  handler: async (ctx, args) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    const round = currentRound(game);
    if (!round) {
      return null;
    }

    const strikeNumber = Math.min(round.strikes[args.player] + 1, 3);
    const guessLabel = args.guess?.trim() || `Strike ${strikeNumber}`;
    const guessEntry = {
      id: `${Date.now()}`,
      player: args.player,
      playerName: playerName(game, args.player),
      guess: guessLabel,
      strikeNumber,
    };

    const nextRounds = game.rounds.map((item: any, index: number) =>
      index === game.currentRoundIndex
        ? {
            ...item,
            wrongGuesses: [...item.wrongGuesses, guessEntry],
            strikes: {
              ...item.strikes,
              [args.player]: strikeNumber,
            },
          }
        : item,
    );

    await ctx.db.patch(game._id, {
      rounds: nextRounds,
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent(
        "wrong",
        "Strike",
        `${guessEntry.playerName} received strike ${strikeNumber}.`,
        args.player,
      ),
    });

    return strikeNumber;
  },
});

export const clearBuzz = mutation({
  args: {},
  handler: async (ctx) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    await ctx.db.patch(game._id, {
      buzz: {
        player: null,
        pressedAt: null,
      },
    });
  },
});

export const adjustStrikes = mutation({
  args: {
    player: v.union(v.literal("player1"), v.literal("player2")),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    const round = currentRound(game);
    if (!round) {
      return null;
    }

    const nextValue = Math.max(0, Math.min(3, round.strikes[args.player] + args.delta));
    const nextRounds = game.rounds.map((item: any, index: number) =>
      index === game.currentRoundIndex
        ? {
            ...item,
            strikes: {
              ...item.strikes,
              [args.player]: nextValue,
            },
          }
        : item,
    );

    await ctx.db.patch(game._id, { rounds: nextRounds });
    return nextValue;
  },
});

export const jumpToRound = mutation({
  args: {
    roundIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await getNormalizedGame(ctx);
    if (!game || args.roundIndex < 0 || args.roundIndex >= game.rounds.length) {
      return null;
    }

    await ctx.db.patch(game._id, {
      currentRoundIndex: args.roundIndex,
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent("round", "Round Live", game.rounds[args.roundIndex].title),
    });
  },
});

export const nextRound = mutation({
  args: {},
  handler: async (ctx) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    const nextIndex = Math.min(game.currentRoundIndex + 1, game.rounds.length - 1);

    await ctx.db.patch(game._id, {
      currentRoundIndex: nextIndex,
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent("round", "Next Round", game.rounds[nextIndex]?.title ?? "Final board"),
    });

    return nextIndex;
  },
});

export const resetRound = mutation({
  args: {},
  handler: async (ctx) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    const nextRounds = game.rounds.map((round: any, index: number) =>
      index === game.currentRoundIndex
        ? {
            ...round,
            answers: round.answers.map((answer: any) => ({ ...answer, revealed: false })),
            wrongGuesses: [],
            strikes: {
              player1: 0,
              player2: 0,
            },
          }
        : round,
    );

    await ctx.db.patch(game._id, {
      rounds: nextRounds,
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent("round", "Round Reset", currentRound(game)?.title ?? "Current round"),
    });
  },
});

export const resetScores = mutation({
  args: {},
  handler: async (ctx) => {
    const game = await getNormalizedGame(ctx);
    if (!game) {
      return null;
    }

    await ctx.db.patch(game._id, {
      scores: {
        player1: 0,
        player2: 0,
      },
      lastEvent: createEvent("round", "Scores Reset", "Both teams are back to zero."),
    });
  },
});

export const migrateLegacyGame = mutation({
  args: {},
  handler: async (ctx) => {
    const rawGame = await getCurrentGame(ctx);
    if (!rawGame) {
      return null;
    }

    const game = normalizeLegacyGame(rawGame);
    await ctx.db.patch(rawGame._id, {
      currentRoundIndex: game.currentRoundIndex,
      rounds: game.rounds,
      lastEvent: game.lastEvent,
    });

    return game._id;
  },
});
