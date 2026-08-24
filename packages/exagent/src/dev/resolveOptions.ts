import { resolvePlatformFlag } from '../plan/platformFlags';
import type { PlanPlatform } from '../plan/types';
import { CommandError } from '../utils/errors';

/** Flags that `exagent dev` handles itself and does not forward to the `expo` CLI. */
const EXAGENT_ONLY_FLAGS = [
  '--no-agent-skills',
  '--no-followups',
  '--no-checkpoint',
  '--plan',
  '--yes',
  '--json',
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
   */
  port: number | null;
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
 * @throws {CommandError} `BAD_ARGS` when `--port` names something that is not a port.
 */
export function resolveDevOptions(argv: string[]): DevOptions {
  return {
    mode: argv.includes('--plan') ? 'plan' : 'run',
    // `--port` is *not* stripped: it is an `expo start` flag and the plan's last step is the one
    // that acts on it. Reading it here only records what was asked for.
    expoArgs: argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
    platform: resolvePlatformFlag(argv),
    json: argv.includes('--json'),
    followups: !argv.includes('--no-followups'),
    checkpoint: !argv.includes('--no-checkpoint'),
    yes: argv.includes('--yes'),
    port: resolvePort(argv),
  };
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
