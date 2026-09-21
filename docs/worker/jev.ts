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

export type AiBinding = {
  run(
    model: 'typesafe/jev',
    input: { state: { path: string }; questions: Record<string, ChoiceQuestion> },
    options: { gateway: { id: string }; signal: AbortSignal }
  ): Promise<unknown>;
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

export async function chooseJevAsync(
  ai: AiBinding,
  pathname: string,
  questions: Record<string, ChoiceQuestion>,
  signal: AbortSignal
) {
  let body = await ai.run(
    'typesafe/jev',
    { state: { path: pathname }, questions },
    { gateway: { id: 'default' }, signal }
  );
  // AI Gateway can wrap the provider output in a completed inference result.
  if (body && typeof body === 'object' && 'state' in body) {
    if (body.state !== 'Completed' || !('result' in body)) {
      throw new Error('Incomplete Jev inference');
    }
    body = body.result;
  }
  const rawAnswers = (body as { answers?: Record<string, unknown> } | null)?.answers;
  const answers: Record<string, ChoiceAnswer> = {};
  for (const [id, question] of Object.entries(questions)) {
    const answer = rawAnswers?.[id];
    if (!isChoiceAnswer(answer, question)) {
      throw new Error('Invalid Jev Choice answer');
    }
    answers[id] = answer;
  }
  return answers;
}
