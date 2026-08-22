import type { PlanPlatform } from '../plan/types';

/** Flags that `exagent start` handles itself and does not forward to `expo start`. */
const EXAGENT_ONLY_FLAGS = [
  '--no-agent-skills',
  '--no-followups',
  '--no-checkpoint',
  '--plan',
  '--smart',
  '--passthrough',
  '--yes',
  '--json',
];

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
  /** Emit the plan, then run its steps. The default, and what `--smart` asks for. */
  | 'smart'
  /** Emit the plan of what must run, then exit without running it (`--plan`). */
  | 'plan'
  /** Wrap `expo start` and forward every other argument to it (`--passthrough`). */
  | 'passthrough';

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
  /** Snapshot the project before a plan that prebuilds runs, cleared by `--no-checkpoint`. */
  checkpoint: boolean;
  /** Approve a plan with build-class steps up front (`--yes`), so no confirmation is asked for. */
  yes: boolean;
}

/**
 * Split `exagent start` arguments into the `expo start` passthrough, the skill-sync decision,
 * and the plan-engine inputs.
 *
 * Planning is the default (LLP 0004 §`exagent status` — Default change). The two escape hatches
 * are ordered by how little they do: `--plan` runs nothing at all, and `--passthrough` runs only
 * `expo start`, so a command line asking for both a hatch and `--smart` gets the narrower one.
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Migration
 * @see llp/0004-smart-start-and-project-state.rfc.md §Contract
 */
export function resolveStartOptions(argv: string[]): StartOptions {
  let mode: StartMode = 'smart';
  if (argv.includes('--plan')) {
    mode = 'plan';
  } else if (argv.includes('--passthrough')) {
    mode = 'passthrough';
  }

  return {
    mode,
    expoArgs: argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
    // The first platform flag wins, the way `arg` resolves repeated flags.
    platform: argv.map((arg) => PLATFORM_FLAGS[arg]).find((platform) => platform != null),
    json: argv.includes('--json'),
    followups: !argv.includes('--no-followups'),
    checkpoint: !argv.includes('--no-checkpoint'),
    yes: argv.includes('--yes'),
  };
}
