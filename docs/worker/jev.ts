const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

export const MAX_CHOICE_OPTIONS = 255;

export type ChoiceQuestion = {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
};

export type ChoiceAnswer = {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

type ChoiceRequest = {
  pathname: string;
  questions: Record<string, ChoiceQuestion>;
  apiKey: string;
  signal: AbortSignal;
};

function isProbability(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isChoiceAnswer(value: unknown, question: ChoiceQuestion): value is ChoiceAnswer {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const answer = value as Partial<ChoiceAnswer>;
  return (
    answer.type === 'choice' &&
    typeof answer.choice === 'string' &&
    Object.hasOwn(question.criteria, answer.choice) &&
    isProbability(answer.confidence) &&
    !!answer.probabilities &&
    Object.keys(question.criteria).every(option => isProbability(answer.probabilities?.[option]))
  );
}

export function createJevClient(fetchImpl: typeof fetch = globalThis.fetch) {
  return {
    async chooseAsync({ pathname, questions, apiKey, signal }: ChoiceRequest) {
      const response = await fetchImpl(JEV_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'jev-latest', state: { path: pathname }, questions }),
        signal,
      });
      if (!response.ok) {
        throw new Error(`Jev API returned ${response.status}`);
      }
      const body: { answers?: Record<string, unknown> } | null = await response.json();
      const answers: Record<string, ChoiceAnswer> = {};
      for (const [id, question] of Object.entries(questions)) {
        const answer = body?.answers?.[id];
        if (!isChoiceAnswer(answer, question)) {
          throw new Error('Invalid Jev Choice answer');
        }
        answers[id] = answer;
      }
      return answers;
    },
  };
}

export type JevClient = ReturnType<typeof createJevClient>;
