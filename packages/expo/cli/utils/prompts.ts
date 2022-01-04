import prompts, { Options, PromptObject, PromptType } from 'prompts';
import { isNonInteractive } from './env';

import { AbortCommandError, CommandError } from './errors';

// NOTE(brentvatne): we don't use strikethrough anywhere in expo-cli currently,
// and prompts doesn't give us control over disabled styles (1), so until we
// open a PR to prompts to make it more extensible in this regard we can just
// have strikethrough make text grey instead through monkey-patching it.
//
// (1): https://github.com/terkelg/prompts/blob/972fbb2d43c7b1ee5058800f441daaf51f2c240f/lib/elements/select.js#L152-L154
const color = require('kleur');
color.strikethrough = color.gray;

export type Question<V extends string = string> = PromptObject<V> & {
  optionsPerPage?: number;
};

export { PromptType };

type PromptOptions = { nonInteractiveHelp?: string } & Options;

export default function prompt(
  questions: Question | Question[],
  { nonInteractiveHelp, ...options }: PromptOptions = {}
) {
  questions = Array.isArray(questions) ? questions : [questions];
  if (isNonInteractive() && questions.length !== 0) {
    let message = `Input is required, but Expo CLI is in non-interactive mode.\n`;
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

// todo: replace this workaround, its still selectable by the cursor
// see: https://github.com/terkelg/prompts/issues/254
prompt.separator = (title: string) => ({ title, disabled: true, value: undefined });

export type NamelessQuestion = Omit<Question<'value'>, 'name' | 'type'>;

/**
 * Create an auto complete list that can be searched and cancelled.
 *
 * @param questions
 * @param options
 */
export async function autoCompleteAsync(
  questions: NamelessQuestion | NamelessQuestion[],
  options?: PromptOptions
): Promise<string> {
  const { value } = await prompt(
    {
      limit: 11,
      suggest(input: any, choices: any) {
        const regex = new RegExp(input, 'i');
        return choices.filter((choice: any) => regex.test(choice.title));
      },
      ...questions,
      name: 'value',
      type: 'autocomplete',
    },
    options
  );
  return value ?? null;
}

/**
 * Create a selection list that can be cancelled.
 *
 * @param questions
 * @param options
 */
export async function selectAsync(
  questions: NamelessQuestion,
  options?: PromptOptions
): Promise<any> {
  const { value } = await prompt(
    {
      limit: 11,
      ...questions,
      // @ts-ignore: onRender not in the types
      onRender(this: {
        cursor: number;
        firstRender: boolean;
        choices: (Omit<prompts.Choice, 'disable'> & { disabled?: boolean })[];
        value: string;
        render: () => void;
        moveCursor: (n: number) => void;
        fire: () => void;
        up: () => void;
        down: () => void;
        bell: () => void;
        next: () => void;
      }) {
        if (this.firstRender) {
          // Ensure the initial state isn't on a disabled item.
          while (this.choices[this.cursor].disabled) {
            this.cursor++;
            if (this.cursor > this.choices.length - 1) break;
          }
          this.fire();
          // Without this, the value will be `0` instead of a string.
          this.value = (this.choices[this.cursor] || {}).value;

          // Support up arrow and `k` key -- no looping
          this.up = () => {
            let next = this.cursor;
            while (true) {
              if (next <= 0) break;
              next--;
              if (!this.choices[next].disabled) break;
            }
            if (!this.choices[next].disabled && next !== this.cursor) {
              this.moveCursor(next);
              this.render();
            } else {
              this.bell();
            }
          };

          // Support down arrow and `j` key -- no looping
          this.down = () => {
            let next = this.cursor;
            while (true) {
              if (next >= this.choices.length - 1) break;
              next++;
              if (!this.choices[next].disabled) break;
            }
            if (!this.choices[next].disabled && next !== this.cursor) {
              this.moveCursor(next);
              this.render();
            } else {
              this.bell();
            }
          };

          // Support tab -- looping
          this.next = () => {
            let next = this.cursor;
            let i = 0;
            while (i < this.choices.length) {
              i++;
              next = (next + 1) % this.choices.length;
              if (!this.choices[next].disabled) break;
            }
            if (!this.choices[next].disabled) {
              this.moveCursor(next);
              this.render();
            } else {
              // unexpected
              this.bell();
            }
          };
        }
      },
      name: 'value',
      type: 'select',
    },
    options
  );
  return value ?? null;
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

/**
 * Create a more dynamic yes/no confirmation that can be cancelled.
 *
 * @param questions
 * @param options
 */
export async function toggleConfirmAsync(
  questions: NamelessQuestion,
  options?: PromptOptions
): Promise<boolean> {
  const { value } = await prompt(
    {
      active: 'yes',
      inactive: 'no',
      ...questions,
      name: 'value',
      type: 'toggle',
    },
    options
  );
  return value ?? null;
}

/**
 * Prompt the user for an email address.
 *
 * @param questions
 * @param options
 */
export async function promptEmailAsync(
  questions: NamelessQuestion,
  options?: PromptOptions
): Promise<string> {
  const { value } = await prompt(
    {
      type: 'text',
      format: (value) => value.trim(),
      validate: (value: string) =>
        /.+@.+/.test(value) ? true : "That doesn't look like a valid email.",
      ...questions,
      name: 'value',
    },
    options
  );
  return value.trim();
}
