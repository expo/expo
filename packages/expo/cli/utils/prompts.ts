import prompts, { Options, Choice, PromptObject, PromptType } from 'prompts';

import { CI } from './env';
import { AbortCommandError, CommandError } from './errors';

export type Question<V extends string = string> = PromptObject<V> & {
  optionsPerPage?: number;
};

export interface ExpoChoice<T> extends Choice {
  value: T;
}

export { PromptType };

type PromptOptions = { nonInteractiveHelp?: string } & Options;

// TODO: rename to `promptAsync`
export default function prompt(
  questions: Question | Question[],
  { nonInteractiveHelp, ...options }: PromptOptions = {}
) {
  questions = Array.isArray(questions) ? questions : [questions];
  if (CI && questions.length !== 0) {
    let message = `Input is required, but 'npx expo' is in non-interactive mode.\n`;
    if (nonInteractiveHelp) {
      message += nonInteractiveHelp;
    } else {
      const question = questions[0];
      const questionMessage =
        typeof question.message === 'function'
          ? question.message(undefined, {}, question)
          : question.message;

      message += `Required input:\n${(questionMessage || '').trim().replace(/^/gm, '> ')}`;
    }
    throw new CommandError('NON_INTERACTIVE', message);
  }
  return prompts(questions, {
    onCancel() {
      throw new AbortCommandError();
    },
    ...options,
  });
}

export type NamelessQuestion = Omit<Question<'value'>, 'name' | 'type'>;

/**
 * Create a standard yes/no confirmation that can be cancelled.
 *
 * @param questions
 * @param options
 */
export async function confirmAsync(
  questions: NamelessQuestion,
  options?: PromptOptions
): Promise<boolean> {
  const { value } = await prompt(
    {
      initial: true,
      ...questions,
      name: 'value',
      type: 'confirm',
    },
    options
  );
  return value ?? null;
}

/** Select an option from a list of options. */
export async function selectAsync<T>(
  message: string,
  choices: ExpoChoice<T>[],
  options?: PromptOptions
): Promise<T> {
  const { value } = await prompt(
    {
      message,
      choices,
      name: 'value',
      type: 'select',
    },
    options
  );
  return value ?? null;
}

export const promptAsync = prompt;
