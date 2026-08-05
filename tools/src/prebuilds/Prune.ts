/**
 * Prune intermediate prebuild artifacts.
 *
 * A prebuild leaves two kinds of output under `packages/precompile/.build/<pkg>/output/`:
 *   - `xcframeworks/` — the composed `.xcframework` and its `.tar.gz` (the deliverables)
 *   - `frameworks/`   — the Xcode DerivedData used to build those slices (intermediates,
 *                       module caches, per-platform `.framework` copies). This is the bulk
 *                       (~2GB per package) and is not reusable across a clean rebuild.
 *
 * `prunePrebuildBuildFilesAsync` removes the DerivedData (`frameworks/`) while keeping
 * everything in `xcframeworks/`. It mirrors the cleanup the external SPM dependency path
 * already does (`SPMBuild` removes its DerivedData after composing).
 *
 * With no names (or `all`) it scans the entire `.build` directory and cleans every cache on
 * disk — independent of package discovery, so it also catches packages that aren't part of
 * the default distributed set (e.g. `@expo/ui`). With explicit names it prunes just those.
 */
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { getPrecompileDir } from '../Directories';
import logger from '../Logger';
import { verifyAllPackagesAsync } from './Utils';

export type PruneOptions = {
  /** Include external (third-party) packages in discovery. Defaults to true. */
  includeExternal?: boolean;
  /** Prune only external (third-party) packages. Defaults to false. */
  externalOnly?: boolean;
  /** Report what would be removed and how much it would free, without deleting anything. */
  dryRun?: boolean;
};

export type PruneResult = {
  exitCode: number;
  removedDirs: number;
  freedKb: number;
};

/** Root of the centralized prebuild cache: `packages/precompile/.build/`. */
function getBuildCacheRoot(): string {
  return path.join(getPrecompileDir(), '.build');
}

/**
 * Returns true for a directory that is a DerivedData root. DerivedData always lives at
 * `output/<flavor>/frameworks` (non-versioned, even for versioned external packages whose
 * xcframeworks are version-prefixed), so we match the literal `frameworks` segment under
 * `output/`. This can never match the `xcframeworks` deliverables (different path segment).
 */
function isDerivedDataDir(dir: string): boolean {
  return path.basename(dir) === 'frameworks' && path.dirname(path.dirname(dir)).endsWith('output');
}

/**
 * Resolves the DerivedData directories to remove under a single package's `output/` tree.
 */
export async function findDerivedDataDirsAsync(buildPath: string): Promise<string[]> {
  const outputDir = path.join(buildPath, 'output');
  if (!(await fs.pathExists(outputDir))) {
    return [];
  }

  const matches = await glob('*/frameworks', { cwd: outputDir, absolute: true });
  return matches.filter(isDerivedDataDir);
}

/**
 * Scans the entire prebuild cache for DerivedData directories across every package on disk,
 * regardless of whether the package is part of any discovered/distributed set.
 */
export async function findAllDerivedDataDirsAsync(): Promise<string[]> {
  const buildRoot = getBuildCacheRoot();
  if (!(await fs.pathExists(buildRoot))) {
    return [];
  }

  // `**` spans the package path (including scopes like `@expo/ui`); `*` is the flavor.
  const matches = await glob('**/output/*/frameworks', { cwd: buildRoot, absolute: true });
  return matches.filter(isDerivedDataDir);
}

/** Returns the size of a directory in kilobytes via `du -sk`, or 0 if it can't be measured. */
async function getDirSizeKbAsync(dir: string): Promise<number> {
  try {
    const { stdout } = await spawnAsync('du', ['-sk', dir]);
    return parseInt(stdout.split('\t')[0], 10) || 0;
  } catch {
    return 0;
  }
}

function formatSize(kb: number): string {
  if (kb >= 1024 * 1024) {
    return `${(kb / 1024 / 1024).toFixed(2)} GB`;
  }
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb} KB`;
}

/**
 * Derives a human-readable package label from a DerivedData path, e.g.
 * `.../.build/@expo/ui/output/debug/frameworks` → `@expo/ui`.
 */
function labelForDerivedDataDir(dir: string): string {
  const rel = path.relative(getBuildCacheRoot(), dir);
  const idx = rel.indexOf(`${path.sep}output${path.sep}`);
  return idx === -1 ? rel : rel.slice(0, idx);
}

/**
 * Removes intermediate build artifacts (Xcode DerivedData) while keeping the composed
 * xcframeworks and tarballs.
 *
 * @param selector An empty array or `['all']` cleans every build cache found on disk;
 *   otherwise an explicit list of package names prunes just those packages.
 * @param options Discovery options (external package handling), used only when names are given.
 */
export async function prunePrebuildBuildFilesAsync(
  selector: string[],
  options: PruneOptions = {}
): Promise<PruneResult> {
  const pruneEverything = selector.length === 0 || (selector.length === 1 && selector[0] === 'all');

  // Map each DerivedData dir to a display label (package name).
  const targets: { label: string; dir: string }[] = [];

  if (pruneEverything) {
    logger.info('🔎 Scanning the prebuild cache for build files to prune...');
    for (const dir of await findAllDerivedDataDirsAsync()) {
      targets.push({ label: labelForDerivedDataDir(dir), dir });
    }
  } else {
    const packages = await verifyAllPackagesAsync(
      selector,
      options.includeExternal ?? true,
      options.externalOnly ?? false,
      false
    );
    for (const pkg of packages) {
      for (const dir of await findDerivedDataDirsAsync(pkg.buildPath)) {
        targets.push({ label: pkg.packageName, dir });
      }
    }
  }

  const dryRun = options.dryRun ?? false;
  let freedKb = 0;
  const prunedPackages = new Set<string>();

  for (const { label, dir } of targets) {
    const kb = await getDirSizeKbAsync(dir);
    freedKb += kb;
    prunedPackages.add(label);
    const action = dryRun ? 'would remove' : 'removing';
    logger.info(
      `🧹 ${chalk.green(label)}: ${action} ${chalk.gray(
        path.relative(getBuildCacheRoot(), dir)
      )} (${formatSize(kb)})`
    );
    if (!dryRun) {
      await fs.remove(dir);
    }
  }

  if (targets.length === 0) {
    logger.info('✨ Nothing to prune — no build files found. XCFrameworks are untouched.');
  } else if (dryRun) {
    logger.info(
      `\n🔍 Dry run: would prune ${chalk.cyan(targets.length)} build folder(s) across ${chalk.cyan(
        prunedPackages.size
      )} package(s), freeing ${chalk.green(formatSize(freedKb))}. Re-run without --dry-run to delete.`
    );
  } else {
    logger.info(
      `\n✅ Pruned ${chalk.cyan(targets.length)} build folder(s) across ${chalk.cyan(
        prunedPackages.size
      )} package(s), freeing ${chalk.green(formatSize(freedKb))}. XCFrameworks kept.`
    );
  }

  return { exitCode: 0, removedDirs: dryRun ? 0 : targets.length, freedKb };
}
