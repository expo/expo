import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import * as Log from '../log';
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
import type { DiscoveredSkill, SkillsAgent, SkillsOptions } from './types';

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
    Log.log('No agent skills found in the project dependencies.');
    return;
  }

  const { agents, source } = await resolveAgentsAsync(projectRoot, { agents: options.agents });
  // Explicit selections become the new cache, so `--agent` can also update an outdated one.
  if ((source === 'prompt' || source === 'flags') && !options.dryRun) {
    await persistAgentSelectionAsync(projectRoot, agents);
  }

  const { created, pruned } = await syncSkillLinksAsync(
    projectRoot,
    skills,
    uniqueSkillsDirs(agents),
    { dryRun: options.dryRun }
  );
  await updateGitIgnoreAsync(projectRoot, uniqueSkillsDirs(getAllAgents()), {
    dryRun: options.dryRun,
  });

  const prefix = options.dryRun ? chalk.dim('[dry-run] ') : '';
  if (created.length || pruned.length) {
    for (const link of created) {
      Log.log(`${prefix}${chalk.green('+')} ${link}`);
    }
    for (const link of pruned) {
      Log.log(`${prefix}${chalk.red('-')} ${link}`);
    }
  }
  const packageCount = new Set(skills.map((skill) => skill.packageName)).size;
  Log.log(
    `${prefix}${skills.length} skill(s) from ${packageCount} package(s) linked for: ${agents
      .map((agent) => agent.displayName)
      .join(', ')}`
  );
}

export async function listSkillsAsync(
  projectRoot: string,
  options: { json?: boolean } = {}
): Promise<void> {
  const skills = await discoverSkillsAsync(projectRoot);

  if (options.json) {
    const skillsDirs = uniqueSkillsDirs(await getConfiguredAgentsAsync(projectRoot));
    const entries = skills.map((skill) => ({
      package: skill.packageName,
      skill: skill.name,
      name: skill.title ?? skill.name,
      description: skill.description ?? null,
      path: skill.path,
      linkName: skill.linkName,
      linkedIn: skillsDirs.filter((dir) =>
        fs.existsSync(path.join(projectRoot, dir, skill.linkName))
      ),
    }));
    Log.log(JSON.stringify(entries, null, 2));
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
      `No skills found for "${packageName}". The package is not installed, or it ships no skills/<name>/SKILL.md directory. Run ${chalk.bold('npx expo skills list')} to see the packages that provide skills.`
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
  const prefix = options.dryRun ? chalk.dim('[dry-run] ') : '';
  for (const link of pruned) {
    Log.log(`${prefix}${chalk.red('-')} ${link}`);
  }
  Log.log(`${prefix}Removed ${pruned.length} managed skill link(s).`);
}

/**
 * Best-effort skill sync for `expo install` and `expo start`, enabled with
 * `expo.skills.autoSync: true` in package.json. Never prompts and never throws.
 * With `packages` (the specs that were just installed), only the skills of those
 * packages are linked and nothing is pruned. Without it, a full sync runs.
 */
export async function autoSyncSkillsAsync(
  projectRoot: string,
  options: { packages?: string[] } = {}
): Promise<void> {
  try {
    const pkg = JsonFile.read(path.join(projectRoot, 'package.json'));
    const skillsConfig = (pkg.expo as undefined | { skills?: { autoSync?: boolean } })?.skills;
    if (skillsConfig?.autoSync !== true) {
      return;
    }

    const agents = await getConfiguredAgentsAsync(projectRoot);
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
    if (created.length || pruned.length) {
      Log.log(
        chalk.gray(
          `Synced agent skills: ${created.length} linked, ${pruned.length} removed. Run ${chalk.bold(
            'npx expo skills list'
          )} for details.`
        )
      );
    }
  } catch (error: any) {
    Log.warn(`Skipping agent skills auto-sync: ${error.message}`);
  }
}

/** Strip the version range from a package spec, e.g. `@expo/ui@~1.2.0` -> `@expo/ui`. */
function parsePackageNameFromSpec(spec: string): string {
  const versionIndex = spec.indexOf('@', 1);
  return versionIndex > 0 ? spec.slice(0, versionIndex) : spec;
}
