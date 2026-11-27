import assert from 'assert';
import type { Choice, Options, PromptObject } from 'prompts';
import prompts from 'prompts';

import { AbortCommandError, CommandError } from './errors';
import { event } from './events';
import { isInteractive } from './interactive';
import { withProgramStatus } from './programStatus';

export type Question<V extends string = string> = PromptObject<V> & {
  optionsPerPage?: number;
};

export interface ExpoChoice<T> extends Choice {
  value: T;
}

type PromptOptions = {
  nonInteractiveHelp?: string;
  programStatusKind?: 'permission' | 'question' | 'auth';
} & Options;

export type NamelessQuestion = Omit<Question<'value'>, 'name' | 'type'>;

type InteractionOptions = { pause: boolean; canEscape?: boolean };

type InteractionCallback = (options: InteractionOptions) => void;

/** Interaction observers for detecting when keystroke tracking should pause/resume. */
const listeners: InteractionCallback[] = [];

export default async function prompt(
  questions: Question | Question[],
  { nonInteractiveHelp, programStatusKind, ...options }: PromptOptions = {}
) {
  questions = Array.isArray(questions) ? questions : [questions];
  if (!isInteractive() && questions.length) {
    throw createInputRequiredError(
      `Input is required, but 'npx expo' is in non-interactive mode.`,
      questions,
      nonInteractiveHelp
    );
  }
  const stdinEndedMessage = `Input is required, but stdin was closed.`;
  if (process.stdin.readableEnded && questions.length) {
    throw createInputRequiredError(stdinEndedMessage, questions, nonInteractiveHelp);
  }

  const kind =
    programStatusKind ??
    (questions.some((question) => question.type === 'password')
      ? 'auth'
      : questions[0]?.type === 'confirm'
        ? 'permission'
        : 'question');
  const msg = typeof questions[0]?.message === 'string' ? questions[0].message : undefined;
  let removeStdinEndListener = () => {};
  const stdinEnded = new Promise<never>((_, reject) => {
    const onEnd = () => {
      process.stdout.write('\n');
      reject(createInputRequiredError(stdinEndedMessage, questions, nonInteractiveHelp));
    };
    process.stdin.once('end', onEnd);
    removeStdinEndListener = () => process.stdin.off('end', onEnd);
  });
  pauseInteractions();
  try {
    return await withProgramStatus({ state: 'blocked', kind, msg }, () =>
      Promise.race([
        prompts(questions, {
          onCancel() {
            throw new AbortCommandError();
          },
          ...options,
        }),
        stdinEnded,
      ])
    );
  } finally {
    removeStdinEndListener();
    resumeInteractions();
  }
}

function createInputRequiredError(
  reason: string,
  questions: Question[],
  nonInteractiveHelp?: string
): CommandError {
  let message = `${reason}\n`;
  if (nonInteractiveHelp) {
    message += nonInteractiveHelp;
  } else {
    const question = questions[0]!;
    const questionMessage =
      typeof question.message === 'function'
        ? question.message(undefined, {}, question)
        : question.message;

    message += `Required input:\n${(questionMessage || '').trim().replace(/^/gm, '> ')}`;
  }
  return new CommandError('NON_INTERACTIVE', message);
}

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

/** Used to pause/resume interaction observers while prompting (made for TerminalUI). */
export function addInteractionListener(callback: InteractionCallback) {
  listeners.push(callback);
}

export function removeInteractionListener(callback: InteractionCallback) {
  const listenerIndex = listeners.findIndex((_callback) => _callback === callback);
  assert(
    listenerIndex >= 0,
    'removeInteractionListener(): cannot remove an unregistered event listener.'
  );
  listeners.splice(listenerIndex, 1);
}

/** Notify all listeners that keypress observations must pause. */
export function pauseInteractions(options: Omit<InteractionOptions, 'pause'> = {}) {
  for (const listener of listeners) {
    listener({ pause: true, ...options });
  }
}

/** Notify all listeners that keypress observations can start. */
export function resumeInteractions(options: Omit<InteractionOptions, 'pause'> = {}) {
  for (const listener of listeners) {
    listener({ pause: false, ...options });
  }
}

export function createSelectionFilter(): (input: any, choices: Choice[]) => Promise<any> {
  function escapeRegex(string: string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  return async (input: any, choices: Choice[]) => {
    try {
      const regex = new RegExp(escapeRegex(input), 'i');
      return choices.filter((choice: any) => regex.test(choice.title));
    } catch (error: any) {
      event('prompt_filter_error', { error: event.error(error as Error) });
      return [];
    }
  };
}
