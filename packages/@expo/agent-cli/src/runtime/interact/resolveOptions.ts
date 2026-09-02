// @ref llp/0018-interaction-commands.rfc.md
// Argument resolution for `runtime:tree`, `runtime:tap` and `runtime:type`. Pure: argv in, options
// out, `CommandError` for anything a caller can get wrong, so every combination is unit-testable.

import type { NavigatePlatform } from '../../navigate/device';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import { parseArgsOrThrow, strayArgumentError } from '../../utils/args';
import { CommandError } from '../../utils/errors';
import { resolveDevServerTarget } from '../devServer';
import { resolveDevicePlatform } from '../devicePlatform';

/**
 * How many nodes the report carries before it truncates.
 *
 * A default cap, not only a flag, because the size of an unbounded tree is a property of the
 * *app* rather than of the command: the spike's notes screen projected to 12 KB and to 241 KB with
 * 300 more list rows (llp/0018-interaction-commands.rfc.md §Must not lose). The interactive projection stayed near 6 KB in both, so
 * this is far above what a normal screen produces and still bounds the pathological one — and a run
 * that hits it says `truncated: true` rather than quietly reporting part of a screen.
 */
export const DEFAULT_MAX_NODES = 200;

/** What all three commands share: which app to talk to, and how to report. */
interface InteractSharedOptions {
  /** The `--dev-server-url` the caller named, or null when the dev server is still to be found. */
  devServerUrl: string | null;
  /** The platform whose app to drive, or undefined for whichever app is connected. */
  platform?: NavigatePlatform;
  /** How many nodes a tree or a verify snapshot carries before it truncates. */
  maxNodes: number;
  json: boolean;
  /**
   * Build the project's entry bundle before reading or driving the app, cleared by
   * `--no-bundle-check`.
   *
   * The same gate and the same flag as `runtime:reload`'s (llp/0010 §Other gates, in brief). These three
   * commands read the bundle the app is *running*, so a project that no longer compiles is a
   * projection of the code from before the edit — and `runtime:tap --verify` reported "the screen
   * changed" for exactly that [friction run 7, F62].
   */
  bundleCheck: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

export interface RuntimeTreeOptions extends InteractSharedOptions {
  /** Report only the elements carrying this testID, and their subtrees. Null for the screen. */
  testID: string | null;
  /** `--all`: every node with a testID, a label, a role, a handler or text. */
  full: boolean;
  /** `--all-screens`: the whole tree, not only the focused screen. */
  allScreens: boolean;
}

/** What a command that drives an element needs on top of the shared options. */
interface InteractCallOptions extends InteractSharedOptions {
  testID: string;
  /** Which of several matched elements, zero-based, or null when the caller named none. */
  index: number | null;
  allScreens: boolean;
  /** Act on an element the app reports as disabled. */
  force: boolean;
}

export interface RuntimeTapOptions extends InteractCallOptions {
  /** `--verify`: walk the tree before and after the tap and report what changed. */
  verify: boolean;
}

export interface RuntimeTypeOptions extends InteractCallOptions {
  /** The text to hand to `onChangeText`. */
  text: string;
  /** `--submit`: call `onSubmitEditing` after the text. */
  submit: boolean;
}

const SHARED_ARGS = {
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §One preflight for the runtime family).
  '--port': String,
  // The three spellings of one fact, as everywhere else in this CLI (`../devicePlatform.ts`).
  '--ios': Boolean,
  '--android': Boolean,
  '--platform': String,
  // Read as a string so an unusable value is reported as the caller typed it, rather than as the
  // `NaN` a numeric handler produces.
  '--max-nodes': String,
  '--json': Boolean,
  '--no-bundle-check': Boolean,
  '--no-followups': Boolean,
};

const TREE_ARGS = {
  ...SHARED_ARGS,
  '--all': Boolean,
  '--all-screens': Boolean,
  '--testID': String,
  // The camel spelling is the prop's own and is what the reports print back, so it is canonical.
  // The kebab spelling is accepted because an unknown flag stops a driving agent dead, and
  // `--test-id` is the spelling every other flag of this CLI would have led it to expect.
  '--test-id': '--testID',
};

const CALL_ARGS = {
  ...SHARED_ARGS,
  '--all-screens': Boolean,
  '--index': String,
  '--force': Boolean,
};

const TAP_ARGS = {
  ...CALL_ARGS,
  '--verify': Boolean,
};

const TYPE_ARGS = {
  ...CALL_ARGS,
  '--testID': String,
  '--test-id': '--testID',
  '--submit': Boolean,
};

/** The one wording for a count this CLI cannot use, whichever path caught it. */
function badCountError(flag: string, value: unknown, min: number): CommandError {
  return new CommandError(
    'BAD_ARGS',
    `${flag} must be a whole number of ${min} or more, but got ${value}.`
  );
}

/** A count flag as a whole number, or the error naming what the caller typed. */
function resolveCount(
  value: unknown,
  flag: string,
  fallback: number | null,
  { min }: { min: number }
): number | null {
  if (value == null) {
    return fallback;
  }
  const count = Number(value);
  if (!Number.isInteger(count) || count < min) {
    throw badCountError(flag, value, min);
  }
  return count;
}

/**
 * The smallest value each numeric flag accepts, which is also the set this pre-scan covers.
 *
 * @ref llp/0018-interaction-commands.rfc.md §Eight shipped decisions — friction run 7, F73.
 */
const COUNT_FLAG_MINIMUMS: { [flag: string]: number } = {
  '--index': 0,
  '--max-nodes': 1,
};

/**
 * Catch a negative count **before** the argument parser reads it as another option.
 *
 * `--index -1` never reaches {@link resolveCount}: `arg` sees a token starting with `-` and reports
 * the flag as having nothing after it, so the caller was told "there was no next argument" about an
 * argument that was right there, and `--index abc` — the same mistake with a different value — got
 * the right message [friction run 7, F73]. This is a pre-scan of the caller's own argv rather than a
 * change to the parser, because a leading `-` legitimately starts an option for every other flag.
 *
 * @throws {CommandError} `BAD_ARGS` naming the flag, the minimum and the value as typed.
 */
function rejectNegativeCounts(argv: string[]): void {
  for (let index = 0; index < argv.length; index++) {
    const min = COUNT_FLAG_MINIMUMS[argv[index]!];
    const value = argv[index + 1];
    if (min != null && value != null && /^-\d/.test(value)) {
      throw badCountError(argv[index]!, value, min);
    }
  }
}

/** The dev server, the platform and the node cap, which every one of the three reads the same. */
function resolveShared(
  args: { readonly [flag: string]: unknown },
  command: string
): InteractSharedOptions {
  return {
    devServerUrl: resolveDevServerTarget(args['--dev-server-url'], args['--port'], command),
    platform: resolveDevicePlatform(args, command, {
      bothHint: `pass one, or leave both out to drive whichever app is connected.`,
    }),
    maxNodes: resolveCount(args['--max-nodes'], '--max-nodes', DEFAULT_MAX_NODES, { min: 1 })!,
    json: !!args['--json'],
    bundleCheck: !args['--no-bundle-check'],
    followups: !args['--no-followups'],
  };
}

/**
 * Resolve the arguments of `@expo/agent-cli runtime:tree`.
 *
 * @throws {CommandError} `BAD_ARGS` for an unknown flag, an unusable count, or a bare word — which
 * is a caller who meant `--testID` and would otherwise have been given the whole screen.
 */
export function resolveTreeOptions(argv: string[]): RuntimeTreeOptions {
  rejectNegativeCounts(argv);
  const args = parseArgsOrThrow(TREE_ARGS, argv, 'runtime:tree');
  if (args._.length > 0) {
    throw strayArgumentError('runtime:tree', args._, {
      hint: `to look at one element, name it with the flag: ${PROGRAM_PREFIX} runtime:tree --testID ${args._[0]}`,
    });
  }

  return {
    ...resolveShared(args, 'runtime:tree'),
    testID: args['--testID'] == null ? null : String(args['--testID']),
    full: !!args['--all'],
    allScreens: !!args['--all-screens'],
  };
}

/** The `--index` of a command that drives one of several matches. */
function resolveIndex(args: { readonly [flag: string]: unknown }): number | null {
  return resolveCount(args['--index'], '--index', null, { min: 0 });
}

/**
 * Resolve the arguments of `@expo/agent-cli runtime:tap`.
 *
 * @throws {CommandError} `BAD_ARGS` for a missing testID, more than one, or an unusable index.
 */
export function resolveTapOptions(argv: string[]): RuntimeTapOptions {
  rejectNegativeCounts(argv);
  const args = parseArgsOrThrow(TAP_ARGS, argv, 'runtime:tap');
  const positional = args._.map(String);
  if (positional.length === 0) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `Missing testID. "${PROGRAM_NAME} runtime:tap" taps the element carrying a testID, and none was named.`,
        `Why: there is no other way to say which element to tap — this walks the app's own component tree, so the testID in the JSX is the address.`,
        `How: pass it as the first argument: ${PROGRAM_PREFIX} runtime:tap <testID>. Run "${PROGRAM_PREFIX} runtime:tree" for the testIDs the screen is carrying.`,
      ].join('\n')
    );
  }
  if (positional.length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      `Expected one testID, but got ${positional.length} arguments (${positional.join(' ')}). "${PROGRAM_NAME} runtime:tap" taps one element; to pick between several elements carrying the same testID, use --index.`
    );
  }

  return {
    ...resolveShared(args, 'runtime:tap'),
    testID: positional[0]!,
    index: resolveIndex(args),
    allScreens: !!args['--all-screens'],
    force: !!args['--force'],
    verify: !!args['--verify'],
  };
}

/**
 * Resolve the arguments of `@expo/agent-cli runtime:type`.
 *
 * The text is the positional and the testID is a flag, which is the shape llp/0018-interaction-commands.rfc.md recommended: the
 * subject of the command is the text, and an input is where it goes.
 *
 * @throws {CommandError} `BAD_ARGS` for missing text, a missing `--testID`, or unquoted text.
 */
export function resolveTypeOptions(argv: string[]): RuntimeTypeOptions {
  rejectNegativeCounts(argv);
  const args = parseArgsOrThrow(TYPE_ARGS, argv, 'runtime:type');
  const positional = args._.map(String);
  if (positional.length === 0) {
    // The three parts every other error of these commands has. This one was a bare one-liner
    // [friction run 7, F77], which is the shape a caller learns nothing from.
    const missingText = new CommandError(
      'BAD_ARGS',
      [
        `Missing text. "${PROGRAM_NAME} runtime:type" types a string into an input, and none was given.`,
        `Why: the text is this command's subject and its first argument, so there is nothing to type — and an empty run is not the same as clearing the field, which is what "" means and is a thing a caller asks for on purpose.`,
        `How: ${PROGRAM_PREFIX} runtime:type "<text>" --testID <id>, or ${PROGRAM_PREFIX} runtime:type "" --testID <id> to clear the input. Run "${PROGRAM_PREFIX} runtime:tree" for the testIDs the screen is carrying.`,
      ].join('\n')
    );
    missingText.suggestedCommand = `${PROGRAM_PREFIX} runtime:tree`;
    throw missingText;
  }
  if (positional.length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      `Expected one string of text, but got ${positional.length} arguments (${positional.join(' ')}). Quote the text so the shell passes it as one argument: ${PROGRAM_PREFIX} runtime:type "${positional.join(' ')}" --testID <id>`
    );
  }
  const testID = args['--testID'] == null ? null : String(args['--testID']);
  if (testID == null) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `Missing --testID. "${PROGRAM_NAME} runtime:type" needs to know which input the text goes into.`,
        `Why: the text is the argument, so the input cannot be one too — and typing into whichever input the walk met first would be a guess about the app.`,
        `How: ${PROGRAM_PREFIX} runtime:type ${JSON.stringify(positional[0])} --testID <id>. Run "${PROGRAM_PREFIX} runtime:tree" for the testIDs the screen is carrying.`,
      ].join('\n')
    );
  }

  return {
    ...resolveShared(args, 'runtime:type'),
    text: positional[0]!,
    testID,
    index: resolveIndex(args),
    allScreens: !!args['--all-screens'],
    force: !!args['--force'],
    submit: !!args['--submit'],
  };
}
