import { resolvePlatformFlag } from '../plan/platformFlags';
import type { PlanPlatform } from '../plan/types';
import type { BuildBackend, RunTarget } from '../settings/types';
import { CommandError } from '../utils/errors';
import { DEFAULT_DETACH_TIMEOUT_MS } from './detachAsync';
import { assertKnownDevFlags } from './knownFlags';

/**
 * Flags that `exagent dev` handles itself and does not forward to the `expo` CLI.
 *
 * The same list `DEV_OWN_FLAGS` names, minus `--help`/`-h`, which never reach this resolver: the
 * command module answers them and exits before it is called.
 */
const EXAGENT_ONLY_FLAGS = [
  '--eas',
  '--local',
  '--no-agent-skills',
  '--no-followups',
  '--no-checkpoint',
  '--plan',
  '--yes',
  '--json',
  '--detach',
  '--wait-ready',
];

/**
 * What `exagent dev` does with the project.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §Contract
 */
export type DevMode =
  /** Emit the plan, then run its steps. The default. */
  | 'run'
  /** Emit the plan of what must run, then exit without running it (`--plan`). */
  | 'plan';

export interface DevOptions {
  mode: DevMode;
  /** Arguments to append after the plan's own, when spawning the `expo` CLI. */
  expoArgs: string[];
  /** Sync skills shortly after the dev server starts, cleared by `--no-agent-skills`. */
  agentSkills: boolean;
  /** Platform asked for on the command line, which the plan engine targets. */
  platform?: PlanPlatform;
  /**
   * Where the caller asked the native build to run (`--eas`, `--local`), or null when neither.
   *
   * The top of the precedence ladder: a flag beats the project's `exagent` config, which beats
   * what the toolchain probe found (llp/0015 §The selection).
   */
  buildBackend: BuildBackend | null;
  /**
   * Which app the caller asked the plan to aim at (`--go`, `--dev-client`), or null when neither.
   *
   * Both are `expo start` flags this command also reads, so asking for a development build on a
   * project Expo Go could run needs no name of its own.
   */
  runTarget: RunTarget | null;
  /** Print the plan as JSON instead of a table (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
  /** Snapshot the project before a plan that prebuilds runs, cleared by `--no-checkpoint`. */
  checkpoint: boolean;
  /** Approve a plan with build-class steps up front (`--yes`), so no confirmation is asked for. */
  yes: boolean;
  /**
   * Port the dev server is asked to listen on (`--port`), or null when the command line names none.
   *
   * The flag was always forwarded to `expo start` — it is one of that CLI's — but it was in no
   * help text, so the way to avoid the "port 8081 is busy, use 8082?" question the Expo CLI asks
   * (and that a run with no terminal cannot answer) was undiscoverable. Naming it here also gives
   * the follow-ups a port they can vouch for.
   *
   * Naming it also makes the port a **requirement**: a run whose named port is taken fails rather
   * than moving to a free one (`src/dev/portCollision.ts`).
   */
  port: number | null;
  /**
   * Run the dev server in a process of its own and give the terminal back (`--detach`).
   *
   * @see llp/0004-smart-start-and-project-state.rfc.md §Daemonization
   */
  detach: boolean;
  /** Under `--detach`, also wait for the bundler to answer before reporting (`--wait-ready`). */
  waitReady: boolean;
  /** How long a detached start may take before the parent gives up on it. */
  detachTimeoutMs: number;
  /**
   * The command line to start the detached child with, i.e. this one minus the flags that are the
   * parent's. Recorded here so the resolver stays the one place that reads argv.
   */
  detachArgv: string[];
}

/**
 * Split `exagent dev` arguments into the `expo start` passthrough, the skill-sync decision, and
 * the plan-engine inputs.
 *
 * Running the plan is the default; `--plan` is the escape hatch that runs nothing at all. The
 * plain `expo start` wrapper is a command of its own now (`exagent start`), so this resolver has
 * no passthrough mode to pick.
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Migration
 * @see llp/0004-smart-start-and-project-state.rfc.md §Contract
 * @throws {CommandError} `BAD_ARGS` when an option belongs to neither CLI, when two options ask
 * for opposite things, or when `--port` names something that is not a port.
 */
export function resolveDevOptions(argv: string[]): DevOptions {
  // First, and before any of the combination rules below: an option neither this command nor
  // `expo start` has cannot have a meaningful interaction with one that exists, and it used to be
  // forwarded — reported by the Expo CLI a step later, or dropped outright by a plan that does not
  // end in `expo start` [friction run 5, F48-3].
  assertKnownDevFlags(argv);

  const detach = argv.includes('--detach');
  const waitReady = argv.includes('--wait-ready');
  if (waitReady && !detach) {
    throw waitReadyWithoutDetach();
  }
  if (detach && argv.includes('--plan')) {
    throw detachWithPlan();
  }

  return {
    mode: argv.includes('--plan') ? 'plan' : 'run',
    // `--port` is *not* stripped: it is an `expo start` flag and the plan's last step is the one
    // that acts on it. Reading it here only records what was asked for.
    expoArgs: argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
    platform: resolvePlatformFlag(argv),
    buildBackend: resolveBuildBackend(argv),
    runTarget: resolveRunTarget(argv),
    json: argv.includes('--json'),
    followups: !argv.includes('--no-followups'),
    checkpoint: !argv.includes('--no-checkpoint'),
    yes: argv.includes('--yes'),
    port: resolvePort(argv),
    detach,
    waitReady,
    detachTimeoutMs: DEFAULT_DETACH_TIMEOUT_MS,
    // The child's argv is built from the same list, so a flag added to this command reaches the
    // detached run without a second place to remember.
    detachArgv: argv,
  };
}

/**
 * Where the caller asked the build to run, or null when they did not say.
 *
 * @throws {CommandError} `BAD_ARGS` when both flags are passed, which asks for two places at once.
 */
function resolveBuildBackend(argv: readonly string[]): BuildBackend | null {
  const eas = argv.includes('--eas');
  const local = argv.includes('--local');
  if (eas && local) {
    throw opposite(
      '--eas and --local name two different places for one build, so this run has no build to plan.',
      'Why: --eas builds in the cloud on EAS, which needs an Expo account; --local builds on this machine, which needs Xcode or the Android SDK. A plan contains one build, and it happens in one place.',
      'How: pass whichever you meant. Passing neither lets this command choose — it prints which and why in the plan, and "npx exagent dev --plan" shows that without running anything.',
      'npx exagent dev --plan'
    );
  }
  return eas ? 'eas' : local ? 'local' : null;
}

/**
 * Which app the caller asked the plan to aim at, or null when they did not say.
 *
 * `--go` and `--dev-client` are `expo start`'s own flags and keep being forwarded to it. What is
 * new is that this command reads them *first*, as the run target the plan is decided against: a
 * project Expo Go can run is planned as a development build when `--dev-client` says so.
 *
 * @throws {CommandError} `BAD_ARGS` when both are passed.
 */
function resolveRunTarget(argv: readonly string[]): RunTarget | null {
  const go = argv.includes('--go') || argv.includes('-g');
  const devClient = argv.includes('--dev-client') || argv.includes('-d');
  if (go && devClient) {
    throw opposite(
      '--go and --dev-client name two different apps to run the project in, so this run has no target to plan for.',
      'Why: --go runs the project inside Expo Go, which needs no native build; --dev-client runs it inside a development build of this project, which needs one. A plan aims at one of them.',
      'How: pass whichever you meant. Passing neither lets this command choose — Expo Go when it can run the project, a development build when it cannot.',
      'npx exagent dev --plan'
    );
  }
  return go ? 'expo-go' : devClient ? 'dev-build' : null;
}

/** Two flags that ask for opposite things, in the three sentences every error here is made of. */
function opposite(
  what: string,
  why: string,
  how: string,
  suggestedCommand: string
): CommandError {
  const error = new CommandError('BAD_ARGS', [what, why, how].join('\n'));
  error.suggestedCommand = suggestedCommand;
  return error;
}

/** `--wait-ready` waits for a dev server this run would not have started. */
function waitReadyWithoutDetach(): CommandError {
  const error = new CommandError(
    'BAD_ARGS',
    [
      `--wait-ready only means something with --detach, and --detach was not passed.`,
      `Why: without --detach this command runs the dev server in the foreground and does not return until it stops, so there is no moment at which it could report that the bundler is ready.`,
      `How: pass both ("npx exagent dev --detach --wait-ready"), or wait on a dev server that is already running with "npx exagent dev:wait".`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev --detach --wait-ready';
  return error;
}

/** `--plan` runs nothing, so there is nothing to detach. */
function detachWithPlan(): CommandError {
  const error = new CommandError(
    'BAD_ARGS',
    [
      `--plan and --detach ask for opposite things, so this run would do nothing.`,
      `Why: --plan prints what would run and exits without running it, and --detach is about where the run goes. There is no plan-shaped thing to put in the background.`,
      `How: run "npx exagent dev --plan" to see the plan, then "npx exagent dev --detach --yes" to run it in the background.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev --plan';
  return error;
}

/**
 * The port `--port` asked for, or null when it was not passed.
 *
 * Only before a `--` separator, which is where `readPortArg` stops too: everything after it is
 * forwarded to something else, and a `--port` there is that tool's. An unusable value is reported
 * here rather than by `expo start` a minute later, which is what every other flag of this command
 * already does.
 */
function resolvePort(argv: string[]): number | null {
  const separator = argv.indexOf('--');
  const own = separator >= 0 ? argv.slice(0, separator) : argv;

  let raw: string | undefined;
  let named = false;
  for (const [index, arg] of own.entries()) {
    if (arg === '--port' || arg === '-p') {
      named = true;
      raw = own[index + 1];
    } else if (/^(--port|-p)=/.test(arg)) {
      named = true;
      raw = arg.slice(arg.indexOf('=') + 1);
    }
  }
  if (!named) {
    return null;
  }

  // A flag that was passed and named nothing is a mistake, not an absent flag.
  const port = Number(raw);
  if (raw == null || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw badPort(raw ?? '');
  }
  return port;
}

function badPort(raw: string): CommandError {
  const error = new CommandError(
    'BAD_ARGS',
    [
      `--port must be a port number from 1 to 65535, but got ${raw || '(nothing)'}.`,
      `Why: the value is handed to "expo start", which listens on it.`,
      `How: pass one, as in "npx exagent dev --port 8082". Leaving --port out lets the Expo CLI pick, which works when 8081 is free.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev --port 8082';
  return error;
}
