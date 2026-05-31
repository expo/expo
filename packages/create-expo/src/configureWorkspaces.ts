import fs from 'fs';
import path from 'path';

import type { PackageManagerName } from './resolvePackageManager';

const debug = require('debug')('expo:init:workspaces') as typeof console.log;

export const PNPM_WORKSPACE_FILENAME = 'pnpm-workspace.yaml';

const WORKSPACE_DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

/**
 * Normalize a monorepo template's workspace-package dependency specs to the
 * chosen package manager's convention, and — for pnpm — write a
 * `pnpm-workspace.yaml` so the workspaces are picked up regardless of the root
 * `package.json` `workspaces` field.
 *
 * - pnpm requires workspace deps to be written as `"workspace:*"`.
 * - yarn / npm / bun handle workspace links given `"*"` (the convention used by
 *   yarn classic + npm workspaces).
 *
 * The function expects the template to use either `"workspace:*"` or `"*"` for
 * intra-monorepo links; other dep specs (semver ranges, file paths, etc.) are
 * left untouched. No-op if the root `package.json` has no `workspaces` field.
 */
export async function configureWorkspacesAsync(
  projectRoot: string,
  packageManager: PackageManagerName
): Promise<void> {
  const rootPackagePath = path.join(projectRoot, 'package.json');
  const rootPackage = await readJsonFileAsync(rootPackagePath);
  if (!rootPackage) {
    debug(`Could not read ${rootPackagePath}; skipping workspace configuration`);
    return;
  }

  const workspacePatterns = getWorkspacePatterns(rootPackage);
  if (!workspacePatterns.length) {
    debug(`No workspaces declared in ${rootPackagePath}; skipping workspace configuration`);
    return;
  }

  const memberPaths = await resolveWorkspaceMemberPathsAsync(projectRoot, workspacePatterns);
  debug(`Found ${memberPaths.length} workspace member(s): ${memberPaths.join(', ')}`);

  const targetSpec = packageManager === 'pnpm' ? 'workspace:*' : '*';
  for (const memberPath of memberPaths) {
    await normalizeWorkspaceDepsAsync(memberPath, targetSpec);
  }

  if (packageManager === 'pnpm') {
    await writePnpmWorkspaceYamlAsync(projectRoot, workspacePatterns);
  }
}

function getWorkspacePatterns(rootPackage: any): string[] {
  const workspaces = rootPackage?.workspaces;
  if (!workspaces) {
    return [];
  }
  if (Array.isArray(workspaces)) {
    return workspaces.filter((p): p is string => typeof p === 'string');
  }
  // Yarn supports the object form `{ "packages": [...], "nohoist": [...] }`.
  if (typeof workspaces === 'object' && Array.isArray(workspaces.packages)) {
    return workspaces.packages.filter((p: unknown): p is string => typeof p === 'string');
  }
  return [];
}

async function resolveWorkspaceMemberPathsAsync(
  projectRoot: string,
  patterns: string[]
): Promise<string[]> {
  // Expand each workspace pattern by reading its parent directory. Supports
  // the conventional monorepo shapes:
  //
  //   "apps/*"       → every child dir of apps/ that contains a package.json
  //   "apps/mobile"  → literal directory if it contains a package.json
  //
  // More complex glob features (`**`, `?(...)`, brace expansion) aren't
  // supported here on purpose — workspace templates almost always use one of
  // the two forms above, and avoiding glob lets us stay deterministic with
  // memfs-backed tests and fast in production.
  const members: string[] = [];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    const expanded = await expandPatternAsync(projectRoot, pattern);
    for (const member of expanded) {
      if (!seen.has(member)) {
        seen.add(member);
        members.push(member);
      }
    }
  }
  return members;
}

async function expandPatternAsync(projectRoot: string, pattern: string): Promise<string[]> {
  const segments = pattern.split('/').filter((s) => s.length > 0);
  if (segments.length === 0) {
    return [];
  }

  // Literal path (no wildcards anywhere) — return it if its package.json exists.
  if (!segments.some((s) => s.includes('*'))) {
    const memberDir = path.resolve(projectRoot, ...segments);
    return (await packageJsonExistsAsync(memberDir)) ? [memberDir] : [];
  }

  // Single trailing wildcard segment — read the parent dir, keep children
  // whose package.json exists.
  if (
    segments[segments.length - 1] === '*' &&
    !segments.slice(0, -1).some((s) => s.includes('*'))
  ) {
    const parentDir = path.resolve(projectRoot, ...segments.slice(0, -1));
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(parentDir, { withFileTypes: true });
    } catch (error: any) {
      debug(`Could not read workspace parent ${parentDir}: ${error?.message ?? error}`);
      return [];
    }
    const matches: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const memberDir = path.join(parentDir, entry.name);
      if (await packageJsonExistsAsync(memberDir)) {
        matches.push(memberDir);
      }
    }
    return matches;
  }

  debug(
    `Unsupported workspace pattern "${pattern}" (only literal paths and trailing /* are handled)`
  );
  return [];
}

async function packageJsonExistsAsync(memberDir: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(path.join(memberDir, 'package.json'));
    return stat.isFile();
  } catch {
    return false;
  }
}

async function normalizeWorkspaceDepsAsync(memberDir: string, targetSpec: string): Promise<void> {
  const pkgPath = path.join(memberDir, 'package.json');
  const pkg = await readJsonFileAsync(pkgPath);
  if (!pkg) {
    debug(`Skipping ${pkgPath} (not readable)`);
    return;
  }

  let changed = false;
  for (const field of WORKSPACE_DEP_FIELDS) {
    const deps = pkg[field] as Record<string, string> | undefined;
    if (!deps) {
      continue;
    }
    for (const [name, spec] of Object.entries(deps)) {
      if ((spec === 'workspace:*' || spec === '*') && spec !== targetSpec) {
        deps[name] = targetSpec;
        changed = true;
      }
    }
  }

  if (changed) {
    await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    debug(`Normalized workspace deps in ${pkgPath} → "${targetSpec}"`);
  }
}

async function readJsonFileAsync(filePath: string): Promise<any | undefined> {
  try {
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(contents);
  } catch {
    return undefined;
  }
}

async function writePnpmWorkspaceYamlAsync(projectRoot: string, patterns: string[]): Promise<void> {
  const yamlPath = path.join(projectRoot, PNPM_WORKSPACE_FILENAME);
  const lines = [
    'packages:',
    ...patterns.map((pattern) => `  - ${quoteIfNeeded(pattern)}`),
    'nodeLinker: hoisted',
    '',
  ];
  await fs.promises.writeFile(yamlPath, lines.join('\n'), 'utf-8');
  debug(`Wrote ${yamlPath}`);
}

function quoteIfNeeded(value: string): string {
  // Quote glob patterns that begin with `*`, `?`, `!`, or `&` so YAML doesn't
  // mis-parse them as tags or anchors.
  return /^[!*?&]/.test(value) ? `"${value}"` : value;
}
