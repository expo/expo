export interface DiscoveredSkill {
  /** Skill identity: the directory name under the package's `skills/` directory. */
  name: string;
  /** Absolute path to the skill directory inside the source package. */
  path: string;
  /** Name of the npm package that ships the skill. */
  packageName: string;
  /**
   * Directory name for the managed link. It matches the skill name, because agents
   * derive the invocable command name from the directory name.
   */
  linkName: string;
  /** Frontmatter `name` from SKILL.md, for display only. */
  title?: string;
  /** Frontmatter `description` from SKILL.md, for display only. */
  description?: string;
}

export interface SkillsAgent {
  /** Stable id used by `--agent` and persisted in `expo.skills.agents`, e.g. 'claude-code'. */
  id: string;
  /** Human-readable name for prompts. */
  displayName: string;
  /** Project-relative skills directory the agent reads, e.g. '.claude/skills'. */
  skillsDir: string;
}

export interface SkillsOptions {
  /** Agent ids passed via `--agent`, skips the interactive prompt. */
  agents: string[];
  /** Print planned changes without writing. */
  dryRun: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups?: boolean;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json?: boolean;
}

/** One skill in a JSON report, the shape `skills:list --json` prints under `skills`. */
export interface SkillJson {
  package: string;
  skill: string;
  /** Frontmatter title, falling back to the skill name. */
  name: string;
  description: string | null;
  path: string;
  linkName: string;
}

/** One agent a sync targeted, as `skills:sync --json` reports it. */
export interface SkillsAgentJson {
  id: string;
  name: string;
  skillsDir: string;
}

/** Why a skill this project ships was not linked. Both are the user's to resolve. */
export type SkippedSkillReason =
  /** The link name is taken by something Expo did not create, so it is not this CLI's to replace. */
  | 'occupied'
  /** Two packages ship a skill of the same name, and the other one has it. */
  | 'duplicate-name';

/**
 * One skill that was wanted and not linked.
 *
 * @ref llp/0021-honest-reports.rfc.md — a report that lists what it did and omits what it could
 * not do reads as a report of a run with nothing left over (F131).
 */
export interface SkippedSkillLink {
  /** Project-relative path of the link that was not made, or null for a name clash. */
  link: string | null;
  /** Package whose skill was skipped. */
  package: string;
  /** Skill name, as the package spells its directory. */
  skill: string;
  reason: SkippedSkillReason;
  /** For a name clash, the package that has the name instead. */
  wonBy?: string;
}

/**
 * Machine shape of `@expo/agent-cli skills:sync --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout, with
 * every key always present. The four lists answer the four questions a caller has after a sync:
 * what the project ships, what is on disk now, what was taken away, and what could not be done.
 */
export interface SkillsSyncJson {
  /** Nothing was written, because `--dry-run` was passed. */
  dryRun: boolean;
  /** Agents the links were made for. */
  agents: SkillsAgentJson[];
  /** Every skill found in the project's dependencies. */
  discovered: SkillJson[];
  /** Project-relative paths of the links this run created. */
  linked: string[];
  /** Project-relative paths of the links this run removed, because their skill is gone. */
  removed: string[];
  /** Skills this project ships that are not linked, and why. Empty when everything linked. */
  skipped: SkippedSkillLink[];
}

/** Machine shape of `@expo/agent-cli skills:clean --json`. */
export interface SkillsCleanJson {
  /** Nothing was written, because `--dry-run` was passed. */
  dryRun: boolean;
  /** Project-relative agent directories that were swept. */
  skillsDirs: string[];
  /** Project-relative paths of the managed links that were removed. */
  removed: string[];
}
