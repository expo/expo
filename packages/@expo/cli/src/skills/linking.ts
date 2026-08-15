import fs from 'fs';
import path from 'path';

import { Log } from '../log';
import { directoryExistsAsync, ensureDirectoryAsync } from '../utils/dir';
import type { DiscoveredSkill } from './types';

/** Marks a link as created by `expo skills`, so sync may safely remove it again. */
export const MANAGED_LINK_PREFIX = 'npm-';

/** Covers every agent directory, e.g. `.claude/skills` and `.agents/skills`. */
const GIT_IGNORE_PATTERN = '**/skills/npm-*';

interface WriteOptions {
  /** Compute the changes and report them without touching the file system. */
  dryRun?: boolean;
}

interface SyncOptions extends WriteOptions {
  /** Remove managed links that are not in the desired set. Defaults to true. */
  prune?: boolean;
}

/** Link every discovered skill into every agent directory and remove links that are no longer wanted. */
export async function syncSkillLinksAsync(
  projectRoot: string,
  skills: DiscoveredSkill[],
  agentDirs: string[],
  options: SyncOptions = {}
): Promise<{ created: string[]; pruned: string[] }> {
  const created: string[] = [];
  const pruned: string[] = [];

  for (const agentDir of agentDirs) {
    const agentDirPath = path.join(projectRoot, agentDir);

    if (skills.length && !options.dryRun) {
      await ensureDirectoryAsync(agentDirPath);
    }

    const linked = new Set<string>();

    for (const skill of skills) {
      const linkPath = path.join(agentDirPath, skill.linkName);
      const stats = await lstatAsync(linkPath);

      if (stats && !stats.isSymbolicLink()) {
        Log.warn(
          `Skipped the "${skill.name}" skill from ${skill.packageName} because ${path.relative(projectRoot, linkPath)} already exists and was not created by Expo. Remove or rename it, then run the command again.`
        );
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

  return { created, pruned };
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

/** Add the managed link pattern to `.gitignore`. Returns true when the file changed. */
export async function ensureGitIgnoreAsync(
  projectRoot: string,
  options: WriteOptions = {}
): Promise<boolean> {
  const gitIgnorePath = path.join(projectRoot, '.gitignore');
  const contents = await fs.promises.readFile(gitIgnorePath, 'utf8').catch(() => null);

  if (contents?.split(/\r?\n/).some((line) => line.trim() === GIT_IGNORE_PATTERN)) {
    return false;
  }

  if (!options.dryRun) {
    const separator = !contents || contents.endsWith('\n') ? '' : '\n';
    await fs.promises.writeFile(
      gitIgnorePath,
      `${contents ?? ''}${separator}${GIT_IGNORE_PATTERN}\n`
    );
  }

  return true;
}

/** Names of the managed links inside an agent directory, ignoring everything the user owns. */
async function listManagedLinksAsync(agentDirPath: string): Promise<string[]> {
  if (!(await directoryExistsAsync(agentDirPath))) {
    return [];
  }

  const names: string[] = [];
  for (const name of await fs.promises.readdir(agentDirPath)) {
    if (!name.startsWith(MANAGED_LINK_PREFIX)) {
      continue;
    }
    if ((await lstatAsync(path.join(agentDirPath, name)))?.isSymbolicLink()) {
      names.push(name);
    }
  }
  return names;
}

async function createSymlinkAsync(skillPath: string, linkPath: string): Promise<void> {
  // A relative target keeps the links working after the project directory moves.
  const target = path.relative(path.dirname(linkPath), skillPath);
  // Junctions are the only directory link Windows creates without developer mode or admin rights.
  // Node resolves a junction target to an absolute path, so relative targets are Unix-only in practice.
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
