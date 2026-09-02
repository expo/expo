import { resolvePlatformFlag } from '../plan/platformFlags';
import type { PlanPlatform } from '../plan/types';

/** Flags that `@expo/agent-cli start` handles itself and does not forward to `expo start`. */
const AGENT_CLI_ONLY_FLAGS = ['--no-agent-skills', '--no-followups'];

export interface StartOptions {
  /** Arguments to append after `start` when spawning the `expo` CLI. */
  expoArgs: string[];
  /** Sync skills shortly after the dev server starts, cleared by `--no-agent-skills`. */
  agentSkills: boolean;
  /** Platform named on the command line, which decides the shape of the follow-up URL. */
  platform?: PlanPlatform;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

/**
 * Split `@expo/agent-cli start` arguments into the `expo start` passthrough and this wrapper's own two
 * decisions: whether to sync skills, and whether to print the follow-ups.
 *
 * `@expo/agent-cli start` is `expo start` (llp/0006 §The `@expo/agent-cli` launcher): only the two flags the
 * wrapper itself owns are stripped, and everything else reaches `expo start` untouched — including
 * flags `expo start` rejects, so the Expo CLI stays the one that reports a bad argument. The
 * plan-first engine is `@expo/agent-cli dev`, which owns `--plan`, `--yes` and `--json`.
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Skills shipped from Expo modules
 */
export function resolveStartOptions(argv: string[]): StartOptions {
  return {
    expoArgs: argv.filter((arg) => !AGENT_CLI_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
    platform: resolvePlatformFlag(argv),
    followups: !argv.includes('--no-followups'),
  };
}
