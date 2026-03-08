export type EditableAnswer = {
  id: string;
  text: string;
  points: number;
};

export type EditableRound = {
  id: string;
  title: string;
  prompt: string;
  answers: EditableAnswer[];
};

export type EditableMatch = {
  playerOneName: string;
  playerTwoName: string;
  playerOneKey: string;
  playerTwoKey: string;
  rounds: EditableRound[];
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyRound(index: number): EditableRound {
  return {
    id: createId(`round-${index + 1}`),
    title: `Round ${index + 1}`,
    prompt: "",
    answers: Array.from({ length: 6 }, (_, answerIndex) => createEmptyAnswer(answerIndex)),
  };
}

export const defaultMatch: EditableMatch = {
  playerOneName: "Team Rose",
  playerTwoName: "Team Blossom",
  playerOneKey: "A",
  playerTwoKey: "L",
  rounds: [
    {
      id: createId("round-1"),
      title: "Women Who Inspire",
      prompt: "Name something people bring to an International Women's Day event.",
      answers: [
        { id: createId("answer-1"), text: "Flowers", points: 34 },
        { id: createId("answer-2"), text: "Signs", points: 25 },
        { id: createId("answer-3"), text: "Friends", points: 17 },
        { id: createId("answer-4"), text: "Water Bottle", points: 11 },
        { id: createId("answer-5"), text: "Camera", points: 8 },
        { id: createId("answer-6"), text: "Gift Bag", points: 5 },
      ],
    },
    {
      id: createId("round-2"),
      title: "Celebration Night",
      prompt: "Name something you would see at a Women's Day celebration dinner.",
      answers: [
        { id: createId("answer-1"), text: "Cake", points: 28 },
        { id: createId("answer-2"), text: "Dressy Outfit", points: 22 },
        { id: createId("answer-3"), text: "Music", points: 19 },
        { id: createId("answer-4"), text: "Speech", points: 13 },
        { id: createId("answer-5"), text: "Decorations", points: 10 },
        { id: createId("answer-6"), text: "Photos", points: 8 },
      ],
    },
  ],
};

export function createEmptyAnswer(index: number): EditableAnswer {
  return {
    id: createId(`answer-${index + 1}`),
    text: "",
    points: 0,
  };
}
