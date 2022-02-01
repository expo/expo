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

export default async function prompt(
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
  pauseInteractions();

  const results = await prompts(questions, {
    onCancel() {
      throw new AbortCommandError();
    },
    ...options,
  });

  resumeInteractions();

  return results;
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

type InteractionOptions = { pause: boolean; canEscape?: boolean };

type InteractionCallback = (options: InteractionOptions) => void;

const listeners: InteractionCallback[] = [];

/**
 * Used to pause/resume interaction observers while prompting (made for TerminalUI).
 *
 * @param callback
 */
export function addInteractionListener(callback: InteractionCallback) {
  listeners.push(callback);
}

export function removeInteractionListener(callback: InteractionCallback) {
  const listenerIndex = listeners.findIndex((_callback) => _callback === callback);
  if (listenerIndex === -1) {
    throw new Error(
      'Logger.removeInteractionListener(): cannot remove an unregistered event listener.'
    );
  }
  listeners.splice(listenerIndex, 1);
}

export function pauseInteractions(options: Omit<InteractionOptions, 'pause'> = {}) {
  for (const listener of listeners) {
    listener({ pause: true, ...options });
  }
}

export function resumeInteractions(options: Omit<InteractionOptions, 'pause'> = {}) {
  for (const listener of listeners) {
    listener({ pause: false, ...options });
  }
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