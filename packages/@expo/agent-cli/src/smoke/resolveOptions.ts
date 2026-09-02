// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Registry rules
// Argument resolution for `@expo/agent-cli smoke`. Pure: argv in, options out, `CommandError` for anything
// a user can get wrong, so every flag combination is testable without a dev server or a device.

import type { CloudPreference } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import { resolveDevServerTarget } from '../runtime/devServer';
import { parseArgsOrThrow, resolveDuration, strayArgumentError } from '../utils/args';
import { CommandError } from '../utils/errors';

/** Platforms a smoke run can be performed on: the two that have a runtime to read. */
export type SmokePlatform = 'ios' | 'android';

/**
 * How long the error window stays open, when `--window` says nothing.
 *
 * Three seconds because the window's job is to catch what the app throws *while it settles* after
 * the route was opened, and a longer default would make the common healthy run feel like a hang.
 * An error thrown before it opened is not in it, which the report says out loud.
 */
export const DEFAULT_SMOKE_WINDOW_MS = 3_000;

/** Total budget of an attach-only run (`--no-start`), which reads a dev server that is already up. */
export const DEFAULT_SMOKE_TIMEOUT_MS = 60_000;

/**
 * Total budget of a run allowed to start the dev server, which is the default.
 *
 * Larger because it contains a cold first bundle, which is the same reason a readiness wait defaults to
 * two minutes: a budget that expired before the common slow path finished would report `22` for
 * every first run of the day.
 *
 * **It does not contain the bootstrap itself.** Starting a dev server and booting a simulator each
 * get a budget of their own (`./phases.ts`), and the time they spend is taken off the clock this
 * bounds — a minute spent waiting for a simulator to come up must not be a minute the error window
 * no longer has (llp/0005 §The run brings its own environment).
 */
export const DEFAULT_SMOKE_START_TIMEOUT_MS = 180_000;

export interface SmokeOptions {
  /** Route to open before the window, or null to read the app where it already is. */
  route: string | null;
  /** Platform to drive and to build the entry bundle for. */
  platform: SmokePlatform;
  /**
   * Which device backends the device-dependent phases may use, decided by `--cloud`.
   *
   * The same ladder `navigate` resolves, and it has to be: the `route` phase *is* `navigate`, and a
   * gate whose route phase and screenshot phase looked at different devices would photograph one
   * device to answer for another.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  cloud: CloudPreference;
  /**
   * Whether this run brings its own environment: start a dev server when there is none, boot a
   * device when there is none, and put both back afterwards. Cleared by `--no-start`.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
   */
  bootstrap: boolean;
  /** How long the error window stays open, in milliseconds. */
  windowMs: number;
  /**
   * Budget for the phases that read the app, in milliseconds.
   *
   * Not for the whole command: the two bootstrap phases have budgets of their own, and what they
   * spend is not taken out of this one.
   */
  timeoutMs: number;
  /** Where the screenshot goes, or null for the default path under `.expo/`. */
  screenshotPath: string | null;
  /** Whether to take one at all, cleared by `--no-screenshot`. */
  screenshot: boolean;
  /** The `--dev-server-url` the caller named, or null when it is still to be found. */
  devServerUrl: string | null;
  /** Check `--route` against the project's routes first, cleared by `--no-route-check`. */
  routeCheck: boolean;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const SMOKE_ARGS = {
  '--route': String,
  '--platform': String,
  '--ios': Boolean,
  '--android': Boolean,
  '--cloud': Boolean,
  // `--start` is what this command does by default now, and it stays accepted rather than being
  // removed: it is on command lines people have already written, and it still names the truth.
  '--start': Boolean,
  '--no-start': Boolean,
  '--window': String,
  '--timeout': String,
  '--screenshot': String,
  '--no-screenshot': Boolean,
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §One preflight for the runtime family).
  '--port': String,
  '--no-route-check': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `@expo/agent-cli smoke`.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, a platform with no runtime to read,
 * a screenshot both asked for and refused, an unusable duration or port, or a stray argument.
 */
export function resolveSmokeOptions(argv: string[]): SmokeOptions {
  const args = parseArgsOrThrow(SMOKE_ARGS, argv, 'smoke');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules. The route is a flag, not a
  // positional: this command's subject is the app, and a bare word is a caller who meant --route.
  if (args._.length > 0) {
    throw strayArgumentError('smoke', args._, {
      hint: `to open a route before the error window, pass it as a flag: ${PROGRAM_PREFIX} smoke --route ${args._[0]}`,
    });
  }

  const platform = resolveSmokePlatform(args);

  if (args['--screenshot'] != null && args['--no-screenshot']) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--screenshot and --no-screenshot ask for opposite things, so this run has no rule for what to do.`,
        `Why: --screenshot names where to write the picture and --no-screenshot says not to take one; there is no reading of the pair that does both.`,
        `How: pass one. Use --screenshot ${args['--screenshot']} to choose the path, or --no-screenshot to skip the capture and everything it needs a device for.`,
      ].join('\n')
    );
  }

  if (args['--start'] && args['--no-start']) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--start and --no-start ask for opposite things, so this run has no rule for what to do.`,
        `Why: --start says to start a dev server and boot a device when there is none, and --no-start says to read what is already running and fail when nothing is; there is no reading of the pair that does both.`,
        `How: pass one, or neither. Starting what is missing is what this command does by default, so --start is only the same thing spelled out loud.`,
      ].join('\n')
    );
  }

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
  // of 2026-08-29. On by default, and the flag that changes anything is the one that turns it off.
  const bootstrap = !args['--no-start'];
  return {
    route: args['--route'] ? String(args['--route']) : null,
    platform,
    cloud: args['--cloud'] ? 'required' : 'fallback',
    bootstrap,
    windowMs: resolveDuration(args['--window'], '--window', DEFAULT_SMOKE_WINDOW_MS, {
      // A window of zero catches nothing and would report an empty one as evidence, which is the
      // reading this whole command exists to stop.
      allowZero: false,
    }),
    timeoutMs: resolveDuration(
      args['--timeout'],
      '--timeout',
      bootstrap ? DEFAULT_SMOKE_START_TIMEOUT_MS : DEFAULT_SMOKE_TIMEOUT_MS,
      { allowZero: false }
    ),
    screenshotPath: args['--screenshot'] ? String(args['--screenshot']) : null,
    screenshot: !args['--no-screenshot'],
    devServerUrl: resolveDevServerTarget(args['--dev-server-url'], args['--port'], 'smoke'),
    routeCheck: !args['--no-route-check'],
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/**
 * Read the platform flags: `--ios`/`--android`, or `--platform <name>`.
 *
 * **`--platform web` is refused**, and this is the one place the command's flag set is narrower
 * than a bundler wait's. The reason is llp/0010 §An empty target list is inconclusive: `/json/list` is
 * the inspector proxy's list of React Native runtimes, a browser registers nothing in it, and this
 * command's whole subject is the running app. Every phase after the bundle check would be skipped,
 * so a `passed` would be a bundle check under a name that promises a runtime check.
 * That section settled the same shape for `--require-app --platform web`, and for the same reason
 * it is exit `1` rather than `22`: no amount of looking again makes a browser answer a debugger.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, or for one with no runtime.
 */
function resolveSmokePlatform(args: { [flag: string]: unknown }): SmokePlatform {
  const named = args['--platform'] == null ? null : String(args['--platform']);
  const flagged = args['--ios'] ? 'ios' : args['--android'] ? 'android' : null;

  if (args['--ios'] && args['--android']) {
    throw new CommandError(
      'BAD_ARGS',
      `--ios and --android name two devices, and this command drives one. Run it twice, once per platform.`
    );
  }

  if (named === 'web') {
    const error = new CommandError(
      'BAD_ARGS',
      [
        `--platform web cannot be smoke-tested, so nothing ran.`,
        `Why: every phase of this command after the bundle check reads the running app through the dev server's debugger, and that list holds React Native runtimes only — a browser running the web bundle never registers one, whether or not the page is open. A pass here would mean "the web bundle compiles" while the word "smoke" promises that the app runs.`,
        `How: run "${PROGRAM_PREFIX} typecheck", which is the part of this that web can answer without a device — it proves this project's own compiler is happy with it. For a runtime gate, run this command with --ios or --android.`,
      ].join('\n')
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} typecheck`;
    throw error;
  }

  if (named != null && named !== 'ios' && named !== 'android') {
    throw new CommandError(
      'BAD_ARGS',
      `--platform ${named} is not a platform this command can drive. Pass ios or android — the two with a device tool and a debuggable runtime.`
    );
  }

  if (named != null && flagged != null && named !== flagged) {
    throw new CommandError(
      'BAD_ARGS',
      `--${flagged} and --platform ${named} name two devices, and this command drives one. Pass one of them.`
    );
  }

  // No flag at all: iOS on a Mac, where an Expo project usually has a simulator open, and Android
  // everywhere else — the same default `resolveDeviceAsync` applies when it looks for a device.
  return (named ?? flagged ?? (process.platform === 'darwin' ? 'ios' : 'android')) as SmokePlatform;
}
