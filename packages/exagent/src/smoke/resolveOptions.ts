// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d)
// Argument resolution for `exagent smoke`. Pure: argv in, options out, `CommandError` for anything
// a user can get wrong, so every flag combination is testable without a dev server or a device.

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

/** Total budget of a run that attaches to a dev server that is already up. */
export const DEFAULT_SMOKE_TIMEOUT_MS = 60_000;

/**
 * Total budget of a run allowed to start the dev server.
 *
 * Larger because it contains a cold first bundle, which is the same reason `dev:wait` defaults to
 * two minutes: a budget that expired before the common slow path finished would report `22` for
 * every first run of the day.
 */
export const DEFAULT_SMOKE_START_TIMEOUT_MS = 180_000;

export interface SmokeOptions {
  /** Route to open before the window, or null to read the app where it already is. */
  route: string | null;
  /** Platform to drive and to build the entry bundle for. */
  platform: SmokePlatform;
  /** Whether this run may start a dev server when it finds none (`--start`). */
  start: boolean;
  /** How long the error window stays open, in milliseconds. */
  windowMs: number;
  /** Total budget for the whole run, in milliseconds. */
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
  '--start': Boolean,
  '--window': String,
  '--timeout': String,
  '--screenshot': String,
  '--no-screenshot': Boolean,
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §The dev server a caller names).
  '--port': String,
  '--no-route-check': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `exagent smoke`.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, a platform with no runtime to read,
 * a screenshot both asked for and refused, an unusable duration or port, or a stray argument.
 */
export function resolveSmokeOptions(argv: string[]): SmokeOptions {
  const args = parseArgsOrThrow(SMOKE_ARGS, argv, 'smoke');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d). The route is a flag, not a
  // positional: this command's subject is the app, and a bare word is a caller who meant --route.
  if (args._.length > 0) {
    throw strayArgumentError('smoke', args._, {
      hint: `to open a route before the error window, pass it as a flag: npx exagent smoke --route ${args._[0]}`,
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

  const start = !!args['--start'];
  return {
    route: args['--route'] ? String(args['--route']) : null,
    platform,
    start,
    windowMs: resolveDuration(args['--window'], '--window', DEFAULT_SMOKE_WINDOW_MS, {
      // A window of zero catches nothing and would report an empty one as evidence, which is the
      // reading this whole command exists to stop.
      allowZero: false,
    }),
    timeoutMs: resolveDuration(
      args['--timeout'],
      '--timeout',
      start ? DEFAULT_SMOKE_START_TIMEOUT_MS : DEFAULT_SMOKE_TIMEOUT_MS,
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
 * than `dev:wait`'s. The reason is llp/0010 §What app counting can and cannot see: `/json/list` is
 * the inspector proxy's list of React Native runtimes, a browser registers nothing in it, and this
 * command's whole subject is the running app. Every phase after the bundle check would be skipped,
 * so a `passed` would be `dev:wait --platform web` under a name that promises a runtime check.
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
        `How: run "npx exagent dev:wait --platform web", which is the part of this that web can answer — it proves the bundler is this project's and that the web entry bundle compiles. For a runtime gate, run this command with --ios or --android.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent dev:wait --platform web';
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
