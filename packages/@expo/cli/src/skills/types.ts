export interface DiscoveredSkill {
  /** Skill identity: the directory name under the package's `skills/` directory. */
  name: string;
  /** Absolute path to the skill directory inside the source package. */
  path: string;
  /** Name of the npm package that ships the skill. */
  packageName: string;
  /**
   * Directory name for the managed link, e.g. `npm-expo-ui-my-skill`.
   * The `npm-` prefix marks links created by this command so sync can prune them safely.
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
}
