/** Flags that `exagent start` handles itself and does not forward to `expo start`. */
const EXAGENT_ONLY_FLAGS = ['--no-agent-skills'];

export interface StartPlan {
  /** Arguments to append after `start` when spawning the `expo` CLI. */
  expoArgs: string[];
  /** Sync skills shortly after the dev server starts, cleared by `--no-agent-skills`. */
  agentSkills: boolean;
}

/**
 * Split `exagent start` arguments into the `expo start` passthrough and the skill-sync decision.
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Migration
 */
export function resolveStartPlan(argv: string[]): StartPlan {
  return {
    expoArgs: argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg)),
    agentSkills: !argv.includes('--no-agent-skills'),
  };
}
