import fs from 'fs';
import path from 'path';

import { Log } from '../log';
import { directoryExistsAsync, ensureDirectoryAsync } from '../utils/dir';
import { toPosixPath } from '../utils/filePath';
import { debugEvent } from './events';
import type { DiscoveredSkill, SkippedSkillLink } from './types';

const GIT_IGNORE_START = '# @generated expo skills start';
const GIT_IGNORE_END = '# @generated expo skills end';

interface WriteOptions {
  /** Compute the changes and report them without touching the file system. */
  dryRun?: boolean;
}

interface SyncOptions extends WriteOptions {
  /** Remove managed links that are not in the desired set. Defaults to true. */
  prune?: boolean;
}

/**
 * Link every discovered skill into every agent directory and remove links that are no longer wanted.
 *
 * The third list is as load-bearing as the other two. A skill can be *wanted and not linked* — a
 * name the user already owns, or a name two packages both ship — and until F131 [live, wave 31]
 * that was a warning on the terminal and nothing else, so a `--json` run reported `linked: []`,
 * `removed: []` and gave a caller no way to tell "nothing to do" from "one of your skills is not
 * linked". Both cases are the user's to resolve, which is exactly why they have to survive into
 * the report.
 */
export async function syncSkillLinksAsync(
  projectRoot: string,
  skills: DiscoveredSkill[],
  agentDirs: string[],
  options: SyncOptions = {}
): Promise<{ created: string[]; pruned: string[]; skipped: SkippedSkillLink[] }> {
  const created: string[] = [];
  const pruned: string[] = [];
  const skipped: SkippedSkillLink[] = [];
  const wanted = dedupeByLinkName(skills, skipped);

  for (const agentDir of agentDirs) {
    const agentDirPath = path.join(projectRoot, agentDir);

    if (wanted.length && !options.dryRun) {
      await ensureDirectoryAsync(agentDirPath);
    }

    const linked = new Set<string>();

    for (const skill of wanted) {
      const linkPath = path.join(agentDirPath, skill.linkName);
      const stats = await lstatAsync(linkPath);

      if (stats && !(await isManagedLinkAsync(linkPath))) {
        const link = path.relative(projectRoot, linkPath);
        Log.warn(
          `Skipped the "${skill.name}" skill from ${skill.packageName} because ${link} already exists and was not created by Expo. Remove or rename it, then run the command again.`
        );
        skipped.push({
          link,
          package: skill.packageName,
          skill: skill.name,
          reason: 'occupied',
        });
        continue;
      }

      linked.add(skill.linkName);

      if (stats && (await isLinkedToAsync(linkPath, skill.path))) {
        continue;
      }

      if (!options.dryRun) {
        if (stats) {
          await fs.promises.unlink(linkPath);
        }
        await createSymlinkAsync(skill.path, linkPath);
      }
      created.push(path.relative(projectRoot, linkPath));
    }

    if (options.prune === false) {
      continue;
    }

    // Managed links we did not just create are stale, e.g. the package was uninstalled.
    for (const linkName of await listManagedLinksAsync(agentDirPath)) {
      if (linked.has(linkName)) {
        continue;
      }
      const linkPath = path.join(agentDirPath, linkName);
      if (!options.dryRun) {
        await fs.promises.unlink(linkPath);
      }
      pruned.push(path.relative(projectRoot, linkPath));
    }
  }

  return { created, pruned, skipped };
}

/** Remove every link created by `expo skills` and leave all other entries alone. */
export async function cleanSkillLinksAsync(
  projectRoot: string,
  agentDirs: string[],
  options: WriteOptions = {}
): Promise<{ pruned: string[] }> {
  const pruned: string[] = [];

  for (const agentDir of agentDirs) {
    const agentDirPath = path.join(projectRoot, agentDir);

    for (const linkName of await listManagedLinksAsync(agentDirPath)) {
      const linkPath = path.join(agentDirPath, linkName);
      if (!options.dryRun) {
        await fs.promises.unlink(linkPath);
      }
      pruned.push(path.relative(projectRoot, linkPath));
    }
  }

  return { pruned };
}

/**
 * Maintain a generated `.gitignore` block listing the managed links, since no
 * single pattern matches links named after their skill. Returns true on change.
 */
export async function updateGitIgnoreAsync(
  projectRoot: string,
  agentDirs: string[],
  options: WriteOptions = {}
): Promise<boolean> {
  const links: string[] = [];
  for (const agentDir of agentDirs) {
    for (const linkName of await listManagedLinksAsync(path.join(projectRoot, agentDir))) {
      links.push(toPosixPath(path.join(agentDir, linkName)));
    }
  }
  links.sort();

  const gitIgnorePath = path.join(projectRoot, '.gitignore');
  const contents = await fs.promises.readFile(gitIgnorePath, 'utf8').catch(() => null);
  if (contents == null && !links.length) {
    return false;
  }

  const lines = contents?.length ? contents.split('\n') : [];
  const blockLines = links.length ? [GIT_IGNORE_START, ...links, GIT_IGNORE_END] : [];
  const start = lines.indexOf(GIT_IGNORE_START);

  let nextLines: string[];
  if (start >= 0) {
    const end = lines.indexOf(GIT_IGNORE_END, start);
    nextLines = [...lines];
    nextLines.splice(start, (end >= 0 ? end : lines.length - 1) - start + 1, ...blockLines);
  } else if (blockLines.length) {
    nextLines = [...lines];
    while (nextLines.at(-1) === '') {
      nextLines.pop();
    }
    nextLines.push(...blockLines);
  } else {
    nextLines = lines;
  }

  let next = nextLines.join('\n');
  if (next.length && !next.endsWith('\n')) {
    next += '\n';
  }
  if (next === (contents ?? '')) {
    return false;
  }

  if (!options.dryRun) {
    await fs.promises.writeFile(gitIgnorePath, next);
  }
  return true;
}

/** Deduplicate same-named skills from different packages, the first package in sorted order wins. */
function dedupeByLinkName(
  skills: DiscoveredSkill[],
  skipped: SkippedSkillLink[]
): DiscoveredSkill[] {
  const byLinkName = new Map<string, DiscoveredSkill>();
  for (const skill of skills) {
    const existing = byLinkName.get(skill.linkName);
    if (existing) {
      debugEvent('skipped_skill', {
        package: skill.packageName,
        skill: skill.name,
        reason: 'duplicate-name',
      });
      Log.warn(
        `Skipped the "${skill.name}" skill from ${skill.packageName} because ${existing.packageName} already provides a skill with the same name.`
      );
      skipped.push({
        link: null,
        package: skill.packageName,
        skill: skill.name,
        reason: 'duplicate-name',
        wonBy: existing.packageName,
      });
      continue;
    }
    byLinkName.set(skill.linkName, skill);
  }
  return [...byLinkName.values()];
}

/** Names of the managed links inside an agent directory, ignoring everything the user owns. */
async function listManagedLinksAsync(agentDirPath: string): Promise<string[]> {
  if (!(await directoryExistsAsync(agentDirPath))) {
    return [];
  }

  const names: string[] = [];
  for (const name of await fs.promises.readdir(agentDirPath)) {
    if (await isManagedLinkAsync(path.join(agentDirPath, name))) {
      names.push(name);
    }
  }
  return names;
}

/** A managed entry is a symlink into node_modules, even when its target no longer exists. */
async function isManagedLinkAsync(linkPath: string): Promise<boolean> {
  if (!(await lstatAsync(linkPath))?.isSymbolicLink()) {
    return false;
  }
  const target = await fs.promises.readlink(linkPath).catch(() => null);
  if (target == null) {
    return false;
  }
  const resolved = path.resolve(path.dirname(linkPath), target);
  return resolved.split(path.sep).includes('node_modules');
}

async function createSymlinkAsync(skillPath: string, linkPath: string): Promise<void> {
  // Relative targets survive moving the project. Windows turns them absolute,
  // since junctions are the only directory link that needs no admin rights.
  const target = path.relative(path.dirname(linkPath), skillPath);
  await fs.promises.symlink(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

async function isLinkedToAsync(linkPath: string, skillPath: string): Promise<boolean> {
  const target = await fs.promises.readlink(linkPath).catch(() => null);
  if (target == null) {
    return false;
  }
  return path.resolve(path.dirname(linkPath), target) === path.resolve(skillPath);
}

async function lstatAsync(filePath: string): Promise<fs.Stats | null> {
  return await fs.promises.lstat(filePath).catch(() => null);
}
