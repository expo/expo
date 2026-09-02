// @ref llp/0003-knowledge-tools-and-skills.rfc.md
// Skills are a directory convention, skills/*/SKILL.md, discovered via autolinking.
import fs from 'fs';
import path from 'path';

import { requireAutolinking } from '../utils/autolinking';
import { isPathInside, maybeRealpathSync } from '../utils/dir';
import { debugEvent } from './events';
import type { DiscoveredSkill } from './types';

const SKILL_FILE_NAME = 'SKILL.md';
const SKILLS_DIR_NAME = 'skills';

// A skill directory name becomes a symlink name and is listed verbatim in .gitignore, so restrict
// it to a safe charset. This blocks a package from injecting newlines or path separators.
const SAFE_SKILL_NAME = /^[A-Za-z0-9._-]+$/;

// Frontmatter sits at the top of the file, so cap the read instead of loading whole skill files.
const FRONTMATTER_MAX_LENGTH = 8192;

/** Finds every skill shipped by the packages in the project's dependency graph. */
export async function discoverSkillsAsync(projectRoot: string): Promise<DiscoveredSkill[]> {
  const autolinking = requireAutolinking(projectRoot);
  const linker = autolinking.makeCachedDependenciesLinker({ projectRoot });
  const resolutions = await linker.scanDependenciesRecursively();

  const skills = await Promise.all(
    Object.values(resolutions).map((resolution) =>
      resolution ? findPackageSkillsAsync(resolution.name, resolution.path) : []
    )
  );

  return skills
    .flat()
    .sort((a, b) => compare(a.packageName, b.packageName) || compare(a.name, b.name));
}

/** Reads the frontmatter of a SKILL.md file without pulling in a YAML parser. */
export function parseSkillFrontmatter(contents: string): { title?: string; description?: string } {
  const lines = contents.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return {};
  }

  const result: { title?: string; description?: string } = {};
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') {
      return result;
    }
    // Only top-level `key: value` pairs are supported; indented or structured values are ignored.
    const match = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    const [, key = '', rawValue = ''] = match;
    const value = unquote(rawValue.trim());
    if (!value) {
      continue;
    }
    if (key === 'name') {
      result.title = value;
    } else if (key === 'description') {
      result.description = value;
    }
  }

  // Frontmatter without a closing delimiter is malformed, so nothing it contains is trustworthy.
  return {};
}

async function findPackageSkillsAsync(
  packageName: string,
  packagePath: string
): Promise<DiscoveredSkill[]> {
  const packageRoot = maybeRealpathSync(packagePath) ?? packagePath;
  const skillsRoot = path.join(packageRoot, SKILLS_DIR_NAME);

  let entries: string[];
  try {
    entries = await fs.promises.readdir(skillsRoot);
  } catch {
    return [];
  }

  const skills: DiscoveredSkill[] = [];
  for (const name of entries) {
    if (!SAFE_SKILL_NAME.test(name)) {
      debugEvent('skipped_skill', { package: packageName, skill: name, reason: 'unsafe-name' });
      continue;
    }

    // Resolve symlinks so a skill entry cannot point at files outside of the package it ships with.
    const skillPath = maybeRealpathSync(path.join(skillsRoot, name));
    if (!skillPath || !isPathInside(skillPath, packageRoot)) {
      debugEvent('skipped_skill', {
        package: packageName,
        skill: name,
        reason: 'outside-package-root',
      });
      continue;
    }

    let contents: string;
    try {
      contents = await readFrontmatterChunkAsync(path.join(skillPath, SKILL_FILE_NAME));
    } catch {
      continue;
    }

    skills.push({
      name,
      path: skillPath,
      packageName,
      linkName: name,
      ...parseSkillFrontmatter(contents),
    });
  }

  return skills;
}

async function readFrontmatterChunkAsync(filePath: string): Promise<string> {
  const file = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(FRONTMATTER_MAX_LENGTH);
    const { bytesRead } = await file.read(buffer, 0, FRONTMATTER_MAX_LENGTH, 0);
    return buffer.toString('utf8', 0, bytesRead);
  } finally {
    await file.close();
  }
}

function unquote(value: string): string {
  const match = /^(['"])(.*)\1$/.exec(value);
  return match?.[2] ?? value;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
