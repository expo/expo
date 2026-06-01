import fs from 'fs';
import path from 'path';

import type { MonorepoConfig, WorkspaceConfig } from './monorepoConfig';
import type { PackageManagerName } from './resolvePackageManager';

const debug = require('debug')('expo:init:workspaces') as typeof console.log;

export const PNPM_WORKSPACE_FILENAME = 'pnpm-workspace.yaml';
export const YARN_RC_FILENAME = '.yarnrc.yml';

const WORKSPACE_DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

/**
 * Normalize a monorepo template's workspace-package dependency specs to the
 * chosen package manager's convention, and emit any package-manager-specific
 * config files needed for the workspaces to resolve correctly.
 *
 * - pnpm requires workspace deps to be written as `"workspace:*"`. We always
 *   write `pnpm-workspace.yaml` so the packages are picked up regardless of
 *   the root `package.json` `workspaces` field. If the template's
 *   `.expo-monorepo-config.json` opts into `workspaceConfig.nodeLinker:
 *   "hoisted"`, the YAML also includes that field (otherwise pnpm uses its
 *   default isolated layout).
 * - yarn / npm / bun handle workspace links given `"*"` (the convention used
 *   by yarn classic + npm workspaces). For yarn specifically — when the
 *   template opts into `workspaceConfig.nodeLinker: "hoisted"` — we also
 *   write a `.yarnrc.yml` with `nodeLinker: node-modules` so yarn 2+ uses a
 *   traditional `node_modules` layout instead of Plug'n'Play. Yarn classic
 *   ignores `.yarnrc.yml` and is hoisted by default, so the file would be
 *   inert there.
 *
 * The function expects the template to use either `"workspace:*"` or `"*"` for
 * intra-monorepo links; other dep specs (semver ranges, file paths, etc.) are
 * left untouched. No-op if the root `package.json` has no `workspaces` field.
 */
export async function configureWorkspacesAsync(
  projectRoot: string,
  packageManager: PackageManagerName,
  monorepoConfig?: MonorepoConfig
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

  const workspaceConfig = monorepoConfig?.workspaceConfig;

  const memberPaths = await resolveWorkspaceMemberPathsAsync(projectRoot, workspacePatterns);
  debug(`Found ${memberPaths.length} workspace member(s): ${memberPaths.join(', ')}`);

  const targetSpec = packageManager === 'pnpm' ? 'workspace:*' : '*';
  for (const memberPath of memberPaths) {
    await normalizeWorkspaceDepsAsync(memberPath, targetSpec);
  }

  if (packageManager === 'pnpm') {
    await ensurePnpmWorkspaceYamlAsync(projectRoot, workspacePatterns, workspaceConfig?.nodeLinker);
  } else if (packageManager === 'yarn' && workspaceConfig?.nodeLinker === 'hoisted') {
    // `.yarnrc.yml` is only consumed by yarn 2+ (berry). Yarn classic (v1)
    // reads `.yarnrc` (no `.yml` suffix) and is hoisted by default, so we
    // skip writing the file when we can prove from `npm_config_user_agent`
    // that the user is on yarn 1. When the version is unknown — the user
    // didn't launch create-expo via `yarn create expo` — we still write,
    // since yarn classic harmlessly ignores `.yarnrc.yml`.
    const yarnMajor = getYarnMajorFromUserAgent();
    if (yarnMajor === 1) {
      debug(`Skipping ${YARN_RC_FILENAME}: yarn classic (v${yarnMajor}) is hoisted by default`);
    } else {
      await ensureYarnHoistedAsync(projectRoot);
    }
  }
}

/**
 * Parse the `npm_config_user_agent` env var (set when create-expo is launched
 * via yarn) and return yarn's major version. `undefined` when the user agent
 * is missing or doesn't lead with `yarn/`.
 */
function getYarnMajorFromUserAgent(): number | undefined {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return undefined;
  }
  const match = userAgent.match(/^yarn\/(\d+)/);
  // The capture group is guaranteed to be present when `match` is truthy
  // (we matched a literal `yarn/` followed by `(\d+)`), but
  // `noUncheckedIndexedAccess` still types `match[1]` as `string | undefined`.
  if (!match || match[1] === undefined) {
    return undefined;
  }
  const major = parseInt(match[1], 10);
  return Number.isFinite(major) ? major : undefined;
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

/**
 * Ensure `pnpm-workspace.yaml` contains a `packages:` block listing our
 * workspace patterns, plus an optional `nodeLinker:` line. If the file
 * doesn't exist we write it from scratch. If it does exist (e.g. the
 * template ships its own with extra pnpm settings like
 * `onlyBuiltDependencies`), we preserve all existing content and only append
 * the blocks that aren't already declared at the top level — so multiple
 * sources can contribute to the same YAML without clobbering each other.
 *
 * We don't parse the YAML (no parser is bundled with create-expo), so the
 * "is this top-level key already present?" check is a simple line-prefix
 * match — good enough for the conventional flat shape pnpm uses.
 */
async function ensurePnpmWorkspaceYamlAsync(
  projectRoot: string,
  patterns: string[],
  nodeLinker: WorkspaceConfig['nodeLinker']
): Promise<void> {
  const yamlPath = path.join(projectRoot, PNPM_WORKSPACE_FILENAME);
  let existing: string | undefined;
  try {
    existing = await fs.promises.readFile(yamlPath, 'utf-8');
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      debug(`Could not read existing ${yamlPath}: ${error?.message ?? error}`);
    }
  }

  const packagesBlock =
    patterns.length > 0
      ? ['packages:', ...patterns.map((pattern) => `  - ${quoteIfNeeded(pattern)}`)].join('\n')
      : undefined;
  const nodeLinkerLine = nodeLinker ? `nodeLinker: ${nodeLinker}` : undefined;

  if (existing === undefined) {
    const lines: string[] = [];
    if (packagesBlock) lines.push(packagesBlock);
    if (nodeLinkerLine) lines.push(nodeLinkerLine);
    lines.push('');
    await fs.promises.writeFile(yamlPath, lines.join('\n'), 'utf-8');
    debug(`Wrote ${yamlPath}`);
    return;
  }

  let updated = existing;
  if (packagesBlock && !/^packages:/m.test(updated)) {
    updated = appendBlock(updated, packagesBlock);
  }
  if (nodeLinkerLine && !/^nodeLinker:/m.test(updated)) {
    updated = appendBlock(updated, nodeLinkerLine);
  }
  if (updated !== existing) {
    await fs.promises.writeFile(yamlPath, updated, 'utf-8');
    debug(`Appended to existing ${yamlPath}`);
  } else {
    debug(`Existing ${yamlPath} already declares the keys we own; leaving it alone`);
  }
}

function appendBlock(content: string, block: string): string {
  const needsLeadingNewline = content.length > 0 && !content.endsWith('\n');
  return `${content}${needsLeadingNewline ? '\n' : ''}${block}\n`;
}

/**
 * Ensure `.yarnrc.yml` declares `nodeLinker: node-modules` so yarn 2+ uses a
 * hoisted node_modules layout instead of Plug'n'Play. If the template already
 * ships its own `.yarnrc.yml` with a `nodeLinker:` line, leave it alone; if
 * the file exists but doesn't mention `nodeLinker:`, append our line; if the
 * file is missing, create it.
 *
 * Yarn classic (v1) ignores `.yarnrc.yml` (it reads `.yarnrc` without the
 * `.yml` suffix) and is hoisted by default, so writing this file is harmless
 * there.
 */
async function ensureYarnHoistedAsync(projectRoot: string): Promise<void> {
  const yarnRcPath = path.join(projectRoot, YARN_RC_FILENAME);
  let existing: string | undefined;
  try {
    existing = await fs.promises.readFile(yarnRcPath, 'utf-8');
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      debug(`Could not read existing ${yarnRcPath}: ${error?.message ?? error}`);
    }
  }

  if (existing === undefined) {
    await fs.promises.writeFile(yarnRcPath, 'nodeLinker: node-modules\n', 'utf-8');
    debug(`Wrote ${yarnRcPath}`);
    return;
  }
  if (/^nodeLinker:/m.test(existing)) {
    debug(`${yarnRcPath} already declares nodeLinker; leaving it alone`);
    return;
  }
  const needsLeadingNewline = existing.length > 0 && !existing.endsWith('\n');
  const append = `${needsLeadingNewline ? '\n' : ''}nodeLinker: node-modules\n`;
  await fs.promises.writeFile(yarnRcPath, existing + append, 'utf-8');
  debug(`Appended nodeLinker: node-modules to ${yarnRcPath}`);
}

function quoteIfNeeded(value: string): string {
  // Quote glob patterns that begin with `*`, `?`, `!`, or `&` so YAML doesn't
  // mis-parse them as tags or anchors.
  return /^[!*?&]/.test(value) ? `"${value}"` : value;
}
