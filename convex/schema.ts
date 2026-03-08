import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const answerValidator = v.object({
  id: v.string(),
  text: v.string(),
  points: v.number(),
  revealed: v.boolean(),
});

const wrongGuessValidator = v.object({
  id: v.string(),
  player: v.union(v.literal("player1"), v.literal("player2")),
  playerName: v.string(),
  guess: v.string(),
  strikeNumber: v.number(),
});

export default defineSchema({
  games: defineTable({
    playerOneName: v.string(),
    playerTwoName: v.string(),
    playerOneKey: v.string(),
    playerTwoKey: v.string(),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    answers: v.optional(v.array(answerValidator)),
    wrongGuesses: v.optional(
      v.array(
        v.object({
          id: v.string(),
          player: v.union(v.literal("player1"), v.literal("player2")),
          playerName: v.string(),
          guess: v.string(),
        }),
      ),
    ),
    strikes: v.optional(v.number()),
    currentRoundIndex: v.optional(v.number()),
    rounds: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          prompt: v.string(),
          answers: v.array(answerValidator),
          wrongGuesses: v.array(wrongGuessValidator),
          strikes: v.object({
            player1: v.number(),
            player2: v.number(),
          }),
        }),
      ),
    ),
    scores: v.object({
      player1: v.number(),
      player2: v.number(),
    }),
    buzz: v.object({
      player: v.union(v.literal("player1"), v.literal("player2"), v.null()),
      pressedAt: v.union(v.number(), v.null()),
    }),
    lastEvent: v.optional(
      v.object({
        id: v.string(),
        type: v.union(v.literal("correct"), v.literal("wrong"), v.literal("round"), v.literal("buzz")),
        title: v.string(),
        detail: v.string(),
        player: v.union(v.literal("player1"), v.literal("player2"), v.null()),
        createdAt: v.number(),
      }),
    ),
  }),
});
