import type { PlanPlatform } from '../plan/types';

/** Flags that `exagent start` handles itself and does not forward to `expo start`. */
const EXAGENT_ONLY_FLAGS = ['--no-agent-skills', '--no-followups', '--plan', '--smart', '--json'];

/** Platform selection flags of `expo start`, mapped onto the plan engine's platforms. */
const PLATFORM_FLAGS: Record<string, PlanPlatform> = {
  '--ios': 'ios',
  '-i': 'ios',
  '--android': 'android',
  '-a': 'android',
  '--web': 'web',
  '-w': 'web',
};

/** Whether an argument only tells the plan engine which platform to target. */
export function isPlatformFlag(arg: string): boolean {
  return arg in PLATFORM_FLAGS;
}

/**
 * What `exagent start` does with the project.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §Contract
 */
export type StartMode =
  /** Wrap `expo start`, exactly as `exagent start` always has. */
  | 'default'
  /** Emit the plan of what must run, then exit without running it (`--plan`). */
  | 'plan'
  /** Emit the plan, then run its steps (`--smart`). */
  | 'smart';

export interface StartOptions {
  mode: StartMode;
  /** Arguments to append after `start` when spawning the `expo` CLI. */
  expoArgs: string[];
  /** Sync skills shortly after the dev server starts, cleared by `--no-agent-skills`. */
  agentSkills: boolean;
  /** Platform asked for on the command line, which the plan engine targets. */
  platform?: PlanPlatform;
  /** Print the plan as JSON instead of a table (`--json`), for `--plan` and `--smart`. */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

/**
 * Split `exagent start` arguments into the `expo start` passthrough, the skill-sync decision,
 * and the plan-engine inputs.
 *
 * `--plan` wins over `--smart`: emitting a plan and stopping is the safe reading of a command
 * line that asks for both.
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Migration
 * @see llp/0004-smart-start-and-project-state.rfc.md §Contract
 */
export function resolveStartOptions(argv: string[]): StartOptions {
  let mode: StartMode = 'default';
  if (argv.includes('--plan')) {
    mode = 'plan';
  } else if (argv.includes('--smart')) {
    mode = 'smart';
  }

  return {
    mode,
    expoArgs: argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
    // The first platform flag wins, the way `arg` resolves repeated flags.
    platform: argv.map((arg) => PLATFORM_FLAGS[arg]).find((platform) => platform != null),
    json: argv.includes('--json'),
    followups: !argv.includes('--no-followups'),
  };
}
