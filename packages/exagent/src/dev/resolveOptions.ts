import { resolvePlatformFlag } from '../plan/platformFlags';
import type { PlanPlatform } from '../plan/types';

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
 */
export function resolveDevOptions(argv: string[]): DevOptions {
  return {
    mode: argv.includes('--plan') ? 'plan' : 'run',
    expoArgs: argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
    platform: resolvePlatformFlag(argv),
    json: argv.includes('--json'),
    followups: !argv.includes('--no-followups'),
    checkpoint: !argv.includes('--no-checkpoint'),
    yes: argv.includes('--yes'),
  };
}
