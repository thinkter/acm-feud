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

const womenInStemSeedRounds = [
  {
    id: "round-1",
    title: "Women In STEM Legacy",
    prompt: "Name a famous woman in STEM whose work changed the world.",
    answers: [
      { id: "round-1-answer-1", text: "Marie Curie", points: 30 },
      { id: "round-1-answer-2", text: "Ada Lovelace", points: 25 },
      { id: "round-1-answer-3", text: "Katherine Johnson", points: 20 },
      { id: "round-1-answer-4", text: "Rosalind Franklin", points: 15 },
      { id: "round-1-answer-5", text: "Grace Hopper", points: 10 },
      { id: "round-1-answer-6", text: "Jane Goodall", points: 5 },
    ],
  },
  {
    id: "round-2",
    title: "Influenced Technology",
    prompt: "Name a technology today that was influenced by a woman innovator.",
    answers: [
      { id: "round-2-answer-1", text: "Programming / Coding Languages", points: 30 },
      { id: "round-2-answer-2", text: "Wi-Fi / Wireless Communication", points: 25 },
      { id: "round-2-answer-3", text: "GPS Navigation", points: 20 },
      { id: "round-2-answer-4", text: "Computer Software", points: 15 },
      { id: "round-2-answer-5", text: "Space Exploration Tech", points: 10 },
      { id: "round-2-answer-6", text: "Medical Imaging / X-Ray", points: 5 },
    ],
  },
  {
    id: "round-3",
    title: "Core Skills",
    prompt: "Name a skill that every great programmer or scientist needs.",
    answers: [
      { id: "round-3-answer-1", text: "Problem Solving", points: 30 },
      { id: "round-3-answer-2", text: "Critical Thinking", points: 25 },
      { id: "round-3-answer-3", text: "Attention to Detail", points: 20 },
      { id: "round-3-answer-4", text: "Creativity", points: 15 },
      { id: "round-3-answer-5", text: "Communication", points: 10 },
      { id: "round-3-answer-6", text: "Patience / Persistence", points: 5 },
    ],
  },
  {
    id: "round-4",
    title: "Desk Essentials",
    prompt: "Name something you would likely find on the desk of a woman in tech.",
    answers: [
      { id: "round-4-answer-1", text: "Laptop / Computer", points: 30 },
      { id: "round-4-answer-2", text: "Coffee / Energy Drink", points: 25 },
      { id: "round-4-answer-3", text: "Sticky Notes", points: 20 },
      { id: "round-4-answer-4", text: "Multiple Monitors", points: 15 },
      { id: "round-4-answer-5", text: "Coding Books", points: 10 },
      { id: "round-4-answer-6", text: "Plant / Personal Decor", points: 5 },
    ],
  },
  {
    id: "round-5",
    title: "STEM Fields Today",
    prompt: "Name a field in STEM where women are making groundbreaking contributions today.",
    answers: [
      { id: "round-5-answer-1", text: "Medicine / Healthcare", points: 30 },
      { id: "round-5-answer-2", text: "Artificial Intelligence", points: 25 },
      { id: "round-5-answer-3", text: "Space Science / Astronomy", points: 20 },
      { id: "round-5-answer-4", text: "Environmental Science", points: 15 },
      { id: "round-5-answer-5", text: "Genetics / Biotech", points: 10 },
      { id: "round-5-answer-6", text: "Robotics / Engineering", points: 5 },
    ],
  },
  {
    id: "round-6",
    title: "Debug Habits",
    prompt: "Name something students do when they're stuck on a coding problem.",
    answers: [
      { id: "round-6-answer-1", text: "Google It", points: 30 },
      { id: "round-6-answer-2", text: "Ask a Friend / Classmate", points: 25 },
      { id: "round-6-answer-3", text: "Take a Break / Walk Away", points: 20 },
      { id: "round-6-answer-4", text: "Watch a YouTube Tutorial", points: 15 },
      { id: "round-6-answer-5", text: "Ask the Professor", points: 10 },
      { id: "round-6-answer-6", text: "Check Stack Overflow", points: 5 },
    ],
  },
  {
    id: "round-7",
    title: "Developer Toolkit",
    prompt: "Name a tech tool or platform every developer probably uses.",
    answers: [
      { id: "round-7-answer-1", text: "GitHub", points: 30 },
      { id: "round-7-answer-2", text: "VS Code / Code Editor", points: 25 },
      { id: "round-7-answer-3", text: "Google / Search Engine", points: 20 },
      { id: "round-7-answer-4", text: "Stack Overflow", points: 15 },
      { id: "round-7-answer-5", text: "Slack / Communication App", points: 10 },
      { id: "round-7-answer-6", text: "Terminal / Command Line", points: 5 },
    ],
  },
  {
    id: "round-8",
    title: "World Problems",
    prompt: "Name a problem in the world today that technology is trying to solve.",
    answers: [
      { id: "round-8-answer-1", text: "Climate Change / Environment", points: 30 },
      { id: "round-8-answer-2", text: "Cancer / Disease", points: 25 },
      { id: "round-8-answer-3", text: "Hunger / Food Shortage", points: 20 },
      { id: "round-8-answer-4", text: "Mental Health", points: 15 },
      { id: "round-8-answer-5", text: "Clean Water Access", points: 10 },
      { id: "round-8-answer-6", text: "Education Inequality", points: 5 },
    ],
  },
  {
    id: "round-9",
    title: "Coder Habits",
    prompt: "Name a habit of people who spend a lot of time coding.",
    answers: [
      { id: "round-9-answer-1", text: "Staying Up Late / All-Nighters", points: 30 },
      { id: "round-9-answer-2", text: "Drinking a Lot of Coffee", points: 25 },
      { id: "round-9-answer-3", text: "Sitting for Long Periods", points: 20 },
      { id: "round-9-answer-4", text: "Wearing Headphones", points: 15 },
      { id: "round-9-answer-5", text: "Talking to Themselves / Debugging Out Loud", points: 10 },
      { id: "round-9-answer-6", text: "Skipping Meals", points: 5 },
    ],
  },
  {
    id: "round-10",
    title: "Why Tech Careers",
    prompt: "Name a reason someone might want to pursue a career in tech.",
    answers: [
      { id: "round-10-answer-1", text: "High Salary / Good Pay", points: 30 },
      { id: "round-10-answer-2", text: "Job Security / High Demand", points: 25 },
      { id: "round-10-answer-3", text: "Make a Difference / Change the World", points: 20 },
      { id: "round-10-answer-4", text: "Love of Problem Solving", points: 15 },
      { id: "round-10-answer-5", text: "Remote Work / Flexibility", points: 10 },
      { id: "round-10-answer-6", text: "Creativity / Innovation", points: 5 },
    ],
  },
  {
    id: "round-11",
    title: "First Languages",
    prompt: "Name a programming language most beginners start with.",
    answers: [
      { id: "round-11-answer-1", text: "Python", points: 30 },
      { id: "round-11-answer-2", text: "JavaScript", points: 25 },
      { id: "round-11-answer-3", text: "Java", points: 20 },
      { id: "round-11-answer-4", text: "Scratch / Block Coding", points: 15 },
      { id: "round-11-answer-5", text: "HTML / CSS", points: 10 },
      { id: "round-11-answer-6", text: "C++", points: 5 },
    ],
  },
  {
    id: "round-12",
    title: "Famous Women In STEM",
    prompt: "Name a famous woman scientist or engineer from a movie, show, or real life.",
    answers: [
      { id: "round-12-answer-1", text: "Marie Curie", points: 30 },
      { id: "round-12-answer-2", text: "Katherine Johnson (Hidden Figures)", points: 25 },
      { id: "round-12-answer-3", text: "Ellie Sattler (Jurassic Park)", points: 20 },
      { id: "round-12-answer-4", text: "Grace Hopper", points: 15 },
      { id: "round-12-answer-5", text: "Abby Sciuto (NCIS)", points: 10 },
      { id: "round-12-answer-6", text: "Samantha Carter (Stargate)", points: 5 },
    ],
  },
  {
    id: "round-13",
    title: "Hackathon Moments",
    prompt: "Name something that might happen at a hackathon.",
    answers: [
      { id: "round-13-answer-1", text: "Coding All Night", points: 30 },
      { id: "round-13-answer-2", text: "Team Pitches / Presentations", points: 25 },
      { id: "round-13-answer-3", text: "Free Pizza / Food", points: 20 },
      { id: "round-13-answer-4", text: "Win Prizes / Awards", points: 15 },
      { id: "round-13-answer-5", text: "Networking / Meeting People", points: 10 },
      { id: "round-13-answer-6", text: "App / Product Demo", points: 5 },
    ],
  },
  {
    id: "round-14",
    title: "Tech Stereotypes",
    prompt: "Name a stereotype about people who work in tech.",
    answers: [
      { id: "round-14-answer-1", text: "Anti-Social / Nerdy", points: 30 },
      { id: "round-14-answer-2", text: "Wears Hoodies All the Time", points: 25 },
      { id: "round-14-answer-3", text: "Obsessed with Gadgets", points: 20 },
      { id: "round-14-answer-4", text: "Bad at Sports / Unfit", points: 15 },
      { id: "round-14-answer-5", text: "Only Eats Junk Food", points: 10 },
      { id: "round-14-answer-6", text: "Sleeps at Their Desk", points: 5 },
    ],
  },
  {
    id: "round-15",
    title: "Future Tech",
    prompt: "Name a technology you think will change the future the most.",
    answers: [
      { id: "round-15-answer-1", text: "Artificial Intelligence (AI)", points: 30 },
      { id: "round-15-answer-2", text: "Self-Driving Cars", points: 25 },
      { id: "round-15-answer-3", text: "Renewable / Clean Energy", points: 20 },
      { id: "round-15-answer-4", text: "Gene Editing / CRISPR", points: 15 },
      { id: "round-15-answer-5", text: "Space Travel / Colonization", points: 10 },
      { id: "round-15-answer-6", text: "Quantum Computing", points: 5 },
    ],
  },
] as const;

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

const acmWomenInTechSeedRounds = [
  {
    id: "acm-round-1",
    title: "Women In STEM Icons",
    prompt: "Name a famous woman in STEM whose work changed the world.",
    answers: [
      { id: "acm-round-1-answer-1", text: "Marie Curie", points: 30 },
      { id: "acm-round-1-answer-2", text: "Ada Lovelace", points: 25 },
      { id: "acm-round-1-answer-3", text: "Katherine Johnson", points: 20 },
      { id: "acm-round-1-answer-4", text: "Rosalind Franklin", points: 15 },
      { id: "acm-round-1-answer-5", text: "Grace Hopper", points: 10 },
      { id: "acm-round-1-answer-6", text: "Jane Goodall", points: 5 },
    ],
  },
  {
    id: "acm-round-2",
    title: "Influential Technology",
    prompt: "Name a technology today that was influenced by a woman innovator.",
    answers: [
      { id: "acm-round-2-answer-1", text: "Programming / Coding Languages", points: 30 },
      { id: "acm-round-2-answer-2", text: "Wi-Fi / Wireless Communication", points: 25 },
      { id: "acm-round-2-answer-3", text: "GPS Navigation", points: 20 },
      { id: "acm-round-2-answer-4", text: "Computer Software", points: 15 },
      { id: "acm-round-2-answer-5", text: "Space Exploration Tech", points: 10 },
      { id: "acm-round-2-answer-6", text: "Medical Imaging / X-Ray", points: 5 },
    ],
  },
  {
    id: "acm-round-3",
    title: "Essential Skills",
    prompt: "Name a skill that every great programmer or scientist needs.",
    answers: [
      { id: "acm-round-3-answer-1", text: "Problem Solving", points: 30 },
      { id: "acm-round-3-answer-2", text: "Critical Thinking", points: 25 },
      { id: "acm-round-3-answer-3", text: "Attention to Detail", points: 20 },
      { id: "acm-round-3-answer-4", text: "Creativity", points: 15 },
      { id: "acm-round-3-answer-5", text: "Communication", points: 10 },
      { id: "acm-round-3-answer-6", text: "Patience / Persistence", points: 5 },
    ],
  },
  {
    id: "acm-round-4",
    title: "Desk Setup",
    prompt: "Name something you would likely find on the desk of a woman in tech.",
    answers: [
      { id: "acm-round-4-answer-1", text: "Laptop / Computer", points: 30 },
      { id: "acm-round-4-answer-2", text: "Charger", points: 25 },
      { id: "acm-round-4-answer-3", text: "Coffee / Energy Drink", points: 20 },
      { id: "acm-round-4-answer-4", text: "Sticky Notes", points: 15 },
      { id: "acm-round-4-answer-5", text: "Multiple Monitors", points: 10 },
      { id: "acm-round-4-answer-6", text: "Plant / Personal Decor", points: 5 },
      { id: "acm-round-4-answer-7", text: "Lipbalm", points: 4 },
    ],
  },
  {
    id: "acm-round-5",
    title: "STEM Frontiers",
    prompt: "Name a field in STEM where women are making groundbreaking contributions today.",
    answers: [
      { id: "acm-round-5-answer-1", text: "Medicine / Healthcare", points: 30 },
      { id: "acm-round-5-answer-2", text: "Artificial Intelligence", points: 25 },
      { id: "acm-round-5-answer-3", text: "Space Science / Astronomy", points: 20 },
      { id: "acm-round-5-answer-4", text: "Environmental Science", points: 15 },
      { id: "acm-round-5-answer-5", text: "Genetics / Biotech", points: 10 },
      { id: "acm-round-5-answer-6", text: "Robotics / Engineering", points: 5 },
    ],
  },
  {
    id: "acm-round-6",
    title: "Stuck On Code",
    prompt: "Name something students do when they're stuck on a coding problem.",
    answers: [
      { id: "acm-round-6-answer-1", text: "AI (ChatGPT / Perplexity)", points: 30 },
      { id: "acm-round-6-answer-2", text: "Ask a Friend / Classmate", points: 25 },
      { id: "acm-round-6-answer-3", text: "Take a Break / Walk Away", points: 20 },
      { id: "acm-round-6-answer-4", text: "Watch a YouTube Tutorial", points: 15 },
      { id: "acm-round-6-answer-5", text: "Check Stack Overflow", points: 10 },
    ],
  },
  {
    id: "acm-round-7",
    title: "Developer Staples",
    prompt: "Name a tech tool or platform every developer probably uses.",
    answers: [
      { id: "acm-round-7-answer-1", text: "GitHub", points: 30 },
      { id: "acm-round-7-answer-2", text: "VS Code / Code Editor", points: 25 },
      { id: "acm-round-7-answer-3", text: "AI (ChatGPT / Perplexity)", points: 20 },
      { id: "acm-round-7-answer-4", text: "Stack Overflow", points: 15 },
      { id: "acm-round-7-answer-5", text: "Slack / Communication App", points: 10 },
      { id: "acm-round-7-answer-6", text: "Terminal / Command Line", points: 5 },
    ],
  },
  {
    id: "acm-round-8",
    title: "Problems To Solve",
    prompt: "Name a problem in the world today that technology is trying to solve.",
    answers: [
      { id: "acm-round-8-answer-1", text: "Climate Change / Environment", points: 30 },
      { id: "acm-round-8-answer-2", text: "Cancer / Disease", points: 25 },
      { id: "acm-round-8-answer-3", text: "Hunger / Food Shortage", points: 20 },
      { id: "acm-round-8-answer-4", text: "Mental Health", points: 15 },
      { id: "acm-round-8-answer-5", text: "Clean Water Access", points: 10 },
      { id: "acm-round-8-answer-6", text: "Education Inequality", points: 5 },
    ],
  },
  {
    id: "acm-round-9",
    title: "Coding Habits",
    prompt: "Name a habit of people who spend a lot of time coding.",
    answers: [
      { id: "acm-round-9-answer-1", text: "Staying Up Late / All-Nighters", points: 30 },
      { id: "acm-round-9-answer-2", text: "Caffeine", points: 25 },
      { id: "acm-round-9-answer-3", text: "Sitting for Long Periods", points: 20 },
      { id: "acm-round-9-answer-4", text: "Wearing Headphones", points: 15 },
      { id: "acm-round-9-answer-5", text: "Talking to Themselves", points: 10 },
      { id: "acm-round-9-answer-6", text: "Skipping Meals", points: 5 },
    ],
  },
  {
    id: "acm-round-10",
    title: "Why Choose Tech",
    prompt: "Name a reason someone might want to pursue a career in tech.",
    answers: [
      { id: "acm-round-10-answer-1", text: "High Salary / Good Pay", points: 30 },
      { id: "acm-round-10-answer-2", text: "Job Security / High Demand", points: 25 },
      { id: "acm-round-10-answer-3", text: "Make a Difference / Change the World", points: 20 },
      { id: "acm-round-10-answer-4", text: "Love of Problem Solving", points: 15 },
      { id: "acm-round-10-answer-5", text: "Remote Work / Flexibility", points: 10 },
      { id: "acm-round-10-answer-6", text: "Creativity / Innovation", points: 5 },
    ],
  },
  {
    id: "acm-round-11",
    title: "Starter Languages",
    prompt: "Name a programming language most beginners start with.",
    answers: [
      { id: "acm-round-11-answer-1", text: "Python", points: 30 },
      { id: "acm-round-11-answer-2", text: "JavaScript", points: 25 },
      { id: "acm-round-11-answer-3", text: "Java", points: 20 },
      { id: "acm-round-11-answer-4", text: "Scratch / Block Coding", points: 15 },
      { id: "acm-round-11-answer-5", text: "HTML / CSS", points: 10 },
      { id: "acm-round-11-answer-6", text: "C++", points: 5 },
    ],
  },
  {
    id: "acm-round-12",
    title: "Women In Science And Tech",
    prompt: "Name a famous woman scientist or engineer from a movie, show, or real life.",
    answers: [
      { id: "acm-round-12-answer-1", text: "Katherine Johnson (Hidden Figures)", points: 30 },
      { id: "acm-round-12-answer-2", text: "Ellie Sattler (Jurassic Park)", points: 25 },
      { id: "acm-round-12-answer-3", text: "Meredith Grey", points: 20 },
      { id: "acm-round-12-answer-4", text: "Shuri", points: 15 },
      { id: "acm-round-12-answer-5", text: "Amy Sara Fowler", points: 10 },
      { id: "acm-round-12-answer-6", text: "Samantha Carter (Stargate)", points: 5 },
    ],
  },
  {
    id: "acm-round-13",
    title: "Hackathon Scene",
    prompt: "Name something that might happen at a hackathon.",
    answers: [
      { id: "acm-round-13-answer-1", text: "Coding All Night", points: 30 },
      { id: "acm-round-13-answer-2", text: "Team Pitches / Presentations", points: 25 },
      { id: "acm-round-13-answer-3", text: "Free Pizza / Food", points: 20 },
      { id: "acm-round-13-answer-4", text: "Win Prizes / Awards", points: 15 },
      { id: "acm-round-13-answer-5", text: "Networking / Meeting People", points: 10 },
      { id: "acm-round-13-answer-6", text: "App / Product Demo", points: 5 },
    ],
  },
  {
    id: "acm-round-14",
    title: "Tech Stereotypes",
    prompt: "Name a stereotype about people who work in tech.",
    answers: [
      { id: "acm-round-14-answer-1", text: "Anti-Social / Nerdy", points: 30 },
      { id: "acm-round-14-answer-2", text: "Wears Hoodies All the Time", points: 25 },
      { id: "acm-round-14-answer-3", text: "Obsessed with Gadgets", points: 20 },
      { id: "acm-round-14-answer-4", text: "Bad at Sports / Unfit", points: 15 },
      { id: "acm-round-14-answer-5", text: "Only Eats Junk Food", points: 10 },
      { id: "acm-round-14-answer-6", text: "Sleeps at Their Desk", points: 5 },
    ],
  },
  {
    id: "acm-round-15",
    title: "Future Shifts",
    prompt: "Name a technology you think will change the future the most.",
    answers: [
      { id: "acm-round-15-answer-1", text: "Artificial Intelligence (AI)", points: 30 },
      { id: "acm-round-15-answer-2", text: "Self-Driving Cars", points: 25 },
      { id: "acm-round-15-answer-3", text: "Renewable / Clean Energy", points: 20 },
      { id: "acm-round-15-answer-4", text: "Gene Editing / CRISPR", points: 15 },
      { id: "acm-round-15-answer-5", text: "Space Travel / Colonization", points: 10 },
      { id: "acm-round-15-answer-6", text: "Quantum Computing", points: 5 },
    ],
  },
] as const;

export const seedAcmWomenInTech = mutation({
  args: {},
  handler: async (ctx) => {
    const existingGames = await ctx.db.query("games").collect();
    const primaryGame = existingGames[0] ?? null;

    if (existingGames.length > 1) {
      await Promise.all(existingGames.slice(1).map((game) => ctx.db.delete(game._id)));
    }

    const nextRounds = acmWomenInTechSeedRounds.map((round) => ({
      id: round.id,
      title: round.title,
      prompt: round.prompt,
      answers: round.answers.map((answer) => ({
        id: answer.id,
        text: answer.text,
        points: answer.points,
        revealed: false,
      })),
      wrongGuesses: [],
      strikes: {
        player1: 0,
        player2: 0,
      },
    }));

    const nextState = {
      playerOneName: "Team Rose",
      playerTwoName: "Team Blossom",
      playerOneKey: "A",
      playerTwoKey: "L",
      currentRoundIndex: 0,
      rounds: nextRounds,
      scores: {
        player1: 0,
        player2: 0,
      },
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent(
        "round",
        "ACM Match Seeded",
        nextRounds[0]?.title ?? "No rounds configured",
      ),
    };

    if (primaryGame) {
      await ctx.db.patch(primaryGame._id, nextState);
      return primaryGame._id;
    }

    return await ctx.db.insert("games", nextState);
  },
});

export const seedWomenInStem = mutation({
  args: {},
  handler: async (ctx) => {
    const existingGames = await ctx.db.query("games").collect();
    const primaryGame = existingGames[0] ?? null;

    if (existingGames.length > 1) {
      await Promise.all(existingGames.slice(1).map((game) => ctx.db.delete(game._id)));
    }

    const nextRounds = womenInStemSeedRounds.map((round) => ({
      id: round.id,
      title: round.title,
      prompt: round.prompt,
      answers: round.answers.map((answer) => ({
        id: answer.id,
        text: answer.text,
        points: answer.points,
        revealed: false,
      })),
      wrongGuesses: [],
      strikes: {
        player1: 0,
        player2: 0,
      },
    }));

    const nextState = {
      playerOneName: "Team Rose",
      playerTwoName: "Team Blossom",
      playerOneKey: "A",
      playerTwoKey: "L",
      currentRoundIndex: 0,
      rounds: nextRounds,
      scores: {
        player1: 0,
        player2: 0,
      },
      buzz: {
        player: null,
        pressedAt: null,
      },
      lastEvent: createEvent("round", "Match Seeded", nextRounds[0]?.title ?? "No rounds configured"),
    };

    if (primaryGame) {
      await ctx.db.patch(primaryGame._id, nextState);
      return primaryGame._id;
    }

    return await ctx.db.insert("games", nextState);
  },
});
