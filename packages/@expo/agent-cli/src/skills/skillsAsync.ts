import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import {
  buildSkillsSyncFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../followups';
import * as Log from '../log';
import { PROGRAM_PREFIX } from '../programName';
import { getAgentTelemetryContext } from '../utils/agent';
import { CommandError } from '../utils/errors';
import {
  detectInstalledAgentsAsync,
  getAllAgents,
  getPersistedAgentIdsAsync,
  persistAgentSelectionAsync,
  resolveAgentsAsync,
} from './agents';
import { discoverSkillsAsync } from './discovery';
import { debugEvent } from './events';
import { cleanSkillLinksAsync, syncSkillLinksAsync, updateGitIgnoreAsync } from './linking';
import type {
  DiscoveredSkill,
  SkillJson,
  SkillsAgent,
  SkillsCleanJson,
  SkillsOptions,
  SkillsSyncJson,
} from './types';

function uniqueSkillsDirs(agents: SkillsAgent[]): string[] {
  return [...new Set(agents.map((agent) => agent.skillsDir))];
}

/** Agents to target without prompting: the cached selection, or the detected ones. */
async function getConfiguredAgentsAsync(projectRoot: string): Promise<SkillsAgent[]> {
  const persistedIds = await getPersistedAgentIdsAsync(projectRoot);
  if (persistedIds != null) {
    return getAllAgents().filter((agent) => persistedIds.includes(agent.id));
  }
  return await detectInstalledAgentsAsync(projectRoot);
}

export async function syncSkillsAsync(projectRoot: string, options: SkillsOptions): Promise<void> {
  const skills = await discoverSkillsAsync(projectRoot);
  if (
    !skills.length &&
    !options.agents.length &&
    (await getPersistedAgentIdsAsync(projectRoot)) == null
  ) {
    // Nothing to link and nobody to link it for: still a report, because a run asked for JSON gets
    // one whether or not it had work to do (llp/0006 §Output contract).
    if (options.json) {
      logSyncJson({
        dryRun: !!options.dryRun,
        agents: [],
        discovered: [],
        linked: [],
        removed: [],
        skipped: [],
      });
      return;
    }
    Log.log('No agent skills found in the project dependencies.');
    return;
  }

  const { agents, source } = await resolveAgentsAsync(projectRoot, { agents: options.agents });
  // The explicit selection becomes the new cache, so `--agent` also updates an outdated one. It is
  // the only source that does: detection is cheap and recomputed every run, and freezing its
  // answer would outlive the marker directory it read.
  if (source === 'flags' && !options.dryRun) {
    await persistAgentSelectionAsync(projectRoot, agents);
  }

  const { created, pruned, skipped } = await syncSkillLinksAsync(
    projectRoot,
    skills,
    uniqueSkillsDirs(agents),
    { dryRun: options.dryRun }
  );
  await updateGitIgnoreAsync(projectRoot, uniqueSkillsDirs(getAllAgents()), {
    dryRun: options.dryRun,
  });

  const skillPackages = [...new Set(skills.map((skill) => skill.packageName))];
  // @ref llp/0017-deferred-commands.reference.md §Not built — agent-aware rendering: a detected agent is
  // told that it does not have to read these files itself.
  const followups = followUpsEnabled(options.followups)
    ? buildSkillsSyncFollowUps({
        skillPackages,
        agentId: getAgentTelemetryContext()?.id ?? null,
      })
    : [];

  if (options.json) {
    logSyncJson(
      {
        dryRun: !!options.dryRun,
        agents: agents.map((agent) => ({
          id: agent.id,
          name: agent.displayName,
          skillsDir: agent.skillsDir,
        })),
        discovered: skills.map(skillToJson),
        linked: created,
        removed: pruned,
        skipped,
      },
      followups
    );
    return;
  }

  const prefix = options.dryRun ? chalk.dim('[dry-run] ') : '';
  if (created.length || pruned.length) {
    for (const link of created) {
      Log.log(`${prefix}${chalk.green('+')} ${link}`);
    }
    for (const link of pruned) {
      Log.log(`${prefix}${chalk.red('-')} ${link}`);
    }
  }
  Log.log(
    `${prefix}${skills.length} skill(s) from ${skillPackages.length} package(s) linked for: ${agents
      .map((agent) => agent.displayName)
      .join(', ')}`
  );
  // The line above counts what the project *ships* and says "linked", which is only true when
  // nothing was skipped — so a run that skipped something corrects it here, in the words of the
  // line it corrects (F131). The reason itself was already warned about; this is the tally.
  if (skipped.length) {
    Log.log(
      `${prefix}${skipped.length} of those skill(s) is not linked: ${skipped
        .map((entry) => `${entry.package}/${entry.skill} (${entry.reason})`)
        .join(', ')}`
    );
  }

  reportFollowUps('skills:sync', followups);
}

/** One skill as every JSON report of this group prints it. */
function skillToJson(skill: DiscoveredSkill): SkillJson {
  return {
    package: skill.packageName,
    skill: skill.name,
    name: skill.title ?? skill.name,
    description: skill.description ?? null,
    path: skill.path,
    linkName: skill.linkName,
  };
}

/** The one object a `skills:sync --json` run prints on stdout, follow-ups included. */
function logSyncJson(report: SkillsSyncJson, followups: FollowUp[] = []): void {
  Log.log(JSON.stringify({ ...report, followups }, null, 2));
}

export async function listSkillsAsync(
  projectRoot: string,
  options: { json?: boolean } = {}
): Promise<void> {
  const skills = await discoverSkillsAsync(projectRoot);

  if (options.json) {
    const skillsDirs = uniqueSkillsDirs(await getConfiguredAgentsAsync(projectRoot));
    const entries = skills.map((skill) => ({
      ...skillToJson(skill),
      linkedIn: skillsDirs.filter((dir) =>
        fs.existsSync(path.join(projectRoot, dir, skill.linkName))
      ),
    }));
    // One object on stdout per llp/0006 §Output contract (not a bare array).
    Log.log(JSON.stringify({ skills: entries }, null, 2));
    return;
  }

  if (!skills.length) {
    Log.log('No agent skills found in the project dependencies.');
    return;
  }

  const skillsDirs = uniqueSkillsDirs(await getConfiguredAgentsAsync(projectRoot));
  const byPackage = new Map<string, DiscoveredSkill[]>();
  for (const skill of skills) {
    byPackage.set(skill.packageName, [...(byPackage.get(skill.packageName) ?? []), skill]);
  }

  for (const [packageName, packageSkills] of byPackage) {
    Log.log(chalk.bold(packageName));
    for (const skill of packageSkills) {
      const linkedDirs = skillsDirs.filter((dir) =>
        fs.existsSync(path.join(projectRoot, dir, skill.linkName))
      );
      const status = linkedDirs.length
        ? chalk.green(`linked in ${linkedDirs.join(', ')}`)
        : chalk.dim('not linked');
      const description = skill.description ? chalk.dim(` - ${skill.description}`) : '';
      Log.log(`  ${skill.name} ${chalk.dim(`(${status})`)}${description}`);
    }
  }
}

/** Print the raw SKILL.md of a package's skills, so agents can read a skill without linking it. */
export async function showSkillsAsync(
  projectRoot: string,
  packageName: string,
  skillName?: string
): Promise<void> {
  const skills = await discoverSkillsAsync(projectRoot);
  const packageSkills = skills.filter((skill) => skill.packageName === packageName);
  if (!packageSkills.length) {
    throw new CommandError(
      'BAD_ARGS',
      `No skills found for "${packageName}". The package is not installed, or it ships no skills/<name>/SKILL.md directory. Run ${chalk.bold(`${PROGRAM_PREFIX} skills:list`)} to see the packages that provide skills.`
    );
  }

  const matched = skillName
    ? packageSkills.filter((skill) => skill.name === skillName)
    : packageSkills;
  if (!matched.length) {
    throw new CommandError(
      'BAD_ARGS',
      `No skill named "${skillName}" in ${packageName}. Available skills: ${packageSkills
        .map((skill) => skill.name)
        .join(', ')}.`
    );
  }

  for (const skill of matched) {
    if (matched.length > 1) {
      Log.log(chalk.dim(`--- ${skill.packageName}/skills/${skill.name}/SKILL.md ---`));
    }
    Log.log(await fs.promises.readFile(path.join(skill.path, 'SKILL.md'), 'utf8'));
  }
}

export async function cleanSkillsAsync(
  projectRoot: string,
  options: Pick<SkillsOptions, 'dryRun'> & Partial<SkillsOptions>
): Promise<void> {
  // Only symlinks into node_modules count as managed, so cleaning every known
  // agent directory is safe, even for agents the user never selected.
  const skillsDirs = uniqueSkillsDirs(getAllAgents());
  const { pruned } = await cleanSkillLinksAsync(projectRoot, skillsDirs, {
    dryRun: options.dryRun,
  });
  await updateGitIgnoreAsync(projectRoot, skillsDirs, { dryRun: options.dryRun });

  if (options.json) {
    const report: SkillsCleanJson = {
      dryRun: !!options.dryRun,
      skillsDirs,
      removed: pruned,
    };
    Log.log(JSON.stringify(report, null, 2));
    return;
  }

  const prefix = options.dryRun ? chalk.dim('[dry-run] ') : '';
  for (const link of pruned) {
    Log.log(`${prefix}${chalk.red('-')} ${link}`);
  }
  Log.log(`${prefix}Removed ${pruned.length} managed skill link(s).`);
}

/**
 * Best-effort skill sync for `@expo/agent-cli install`, `@expo/agent-cli start` and `@expo/agent-cli dev`. Runs only for the
 * agents cached in `.expo/agent-skill-links.json` by a previous `npx @expo/agent-cli skills` run, so it
 * stays off until the user selects agents once. Never prompts and never throws.
 * With `packages` (the specs that were just installed), only the skills of those
 * packages are linked and nothing is pruned. Without it, a full sync runs.
 */
export async function autoSyncSkillsAsync(
  projectRoot: string,
  options: { packages?: string[]; silent?: boolean } = {}
): Promise<void> {
  try {
    const persistedIds = await getPersistedAgentIdsAsync(projectRoot);
    const agents = getAllAgents().filter((agent) => persistedIds?.includes(agent.id));
    if (!agents.length) {
      debugEvent('auto_sync_skipped', { reason: 'no-agents' });
      return;
    }

    const packageNames = options.packages?.map(parsePackageNameFromSpec);
    let skills = await discoverSkillsAsync(projectRoot);
    if (packageNames) {
      skills = skills.filter((skill) => packageNames.includes(skill.packageName));
    }

    const { created, pruned } = await syncSkillLinksAsync(
      projectRoot,
      skills,
      uniqueSkillsDirs(agents),
      packageNames ? { prune: false } : {}
    );
    if (created.length || pruned.length) {
      await updateGitIgnoreAsync(projectRoot, uniqueSkillsDirs(getAllAgents()), {});
    }
    // The caller may own stdout, e.g. it prints one JSON object (`--json`), and a line about
    // linked skills in the middle of that object is what makes it unparseable.
    if ((created.length || pruned.length) && !options.silent) {
      Log.log(
        chalk.gray(
          `Synced agent skills: ${created.length} linked, ${pruned.length} removed. Run ${chalk.bold(
            `${PROGRAM_PREFIX} skills:list`
          )} for details.`
        )
      );
    }
  } catch (error: any) {
    if (!options.silent) {
      Log.warn(`Skipping agent skills auto-sync: ${error.message}`);
    }
  }
}

/**
 * Print the SKILL.md of the packages that were just installed, so the coding agent
 * that runs the install loads the skills into context right away. Does nothing
 * when no agent is detected. Never throws.
 */
export async function printSkillsForAgentAsync(
  projectRoot: string,
  options: { packages: string[] }
): Promise<void> {
  try {
    if (getAgentTelemetryContext() == null) {
      return;
    }

    const packageNames = options.packages.map(parsePackageNameFromSpec);
    const skills = (await discoverSkillsAsync(projectRoot)).filter((skill) =>
      packageNames.includes(skill.packageName)
    );
    if (!skills.length) {
      return;
    }

    Log.log(chalk.bold('The installed packages ship agent skills. Read them before use:'));
    for (const skill of skills) {
      // Show the skill directory so relative `references/*` links in SKILL.md resolve.
      Log.log(chalk.dim(`--- ${skill.packageName} skill: ${skill.path} ---`));
      Log.log(await fs.promises.readFile(path.join(skill.path, 'SKILL.md'), 'utf8'));
    }
  } catch (error: any) {
    Log.warn(`Skipping agent skills output: ${error.message}`);
  }
}

/**
 * Which of the given package specs ship an agent skill.
 *
 * Best-effort, like the sync itself: a dependency graph that cannot be walked means "no skills"
 * rather than a failed command, because the caller only uses this to word a follow-up.
 *
 * @param packages package specs as passed to `expo install`, version ranges included.
 */
export async function listSkillPackagesAsync(
  projectRoot: string,
  packages: string[]
): Promise<string[]> {
  if (!packages.length) {
    return [];
  }

  try {
    const packageNames = packages.map(parsePackageNameFromSpec);
    const skills = await discoverSkillsAsync(projectRoot);
    // Ordered by the command line, so a follow-up names the package the user asked for first.
    return packageNames.filter((name) => skills.some((skill) => skill.packageName === name));
  } catch (error: any) {
    debugEvent('skill_packages_failed', { error: debugEvent.error(error as Error) });
    return [];
  }
}

/** Strip the version range from a package spec, e.g. `@expo/ui@~1.2.0` -> `@expo/ui`. */
function parsePackageNameFromSpec(spec: string): string {
  const versionIndex = spec.indexOf('@', 1);
  return versionIndex > 0 ? spec.slice(0, versionIndex) : spec;
}
