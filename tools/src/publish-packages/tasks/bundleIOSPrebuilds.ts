import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';

import { loadRequestedParcels } from './loadRequestedParcels';
import { EXPO_DIR, PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner, spawnAsync } from '../../Utils';
import { runPrebuildPackagesAsync } from '../../commands/PrebuildPackages';
import { IOS_PREBUILD_PACKAGES } from '../../prebuilds/Utils';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Xcode version that prebuilds must be built with. Each Xcode bundles a specific Swift
 * compiler, and `.swiftinterface` files emitted by a newer Swift cannot be parsed by an
 * older one, which breaks consumers who haven't yet upgraded. Keep in sync with the CI
 * workflows that publish artifacts (see .github/workflows/publish-canaries.yml).
 */
export const SUPPORTED_XCODE_VERSION = '26.4.1';

type InstalledXcode = { developerDir: string; xcode: string | null };

// Returns major.minor.patch (`Xcode 26.4` → `26.4.0`); `null` when the prefix isn't found.
export function parseXcodeVersion(output: string): string | null {
  const match = output.match(/Xcode\s+(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return `${match[1]}.${match[2] ?? '0'}.${match[3] ?? '0'}`;
}

async function readXcodeVersionAsync(developerDir?: string): Promise<string | null> {
  const env = developerDir ? { ...process.env, DEVELOPER_DIR: developerDir } : process.env;
  try {
    const { stdout } = await spawnAsync('xcodebuild', ['-version'], { env });
    return parseXcodeVersion(stdout);
  } catch {
    return null;
  }
}

async function listInstalledXcodesAsync(): Promise<InstalledXcode[]> {
  const entries = await fs.promises.readdir('/Applications').catch(() => [] as string[]);
  const xcodeApps = entries.filter((n) => /^Xcode.*\.app$/i.test(n));
  return Promise.all(
    xcodeApps.map(async (name) => {
      const developerDir = path.join('/Applications', name, 'Contents', 'Developer');
      const xcode = await readXcodeVersionAsync(developerDir);
      return { developerDir, xcode };
    })
  );
}

// Returns a restorer that undoes any DEVELOPER_DIR mutation (no-op if none).
// `readActive` / `listInstalled` are injection seams for tests.
export async function ensureSupportedToolchainAsync(
  readActive: () => Promise<string | null> = () => readXcodeVersionAsync(),
  listInstalled: () => Promise<InstalledXcode[]> = listInstalledXcodesAsync
): Promise<() => void> {
  const active = await readActive();
  if (active === SUPPORTED_XCODE_VERSION) {
    logger.log(`   Using active toolchain: Xcode ${active}`);
    return () => {};
  }

  const installed = await listInstalled();
  const match = installed.find((t) => t.xcode === SUPPORTED_XCODE_VERSION);
  if (match) {
    const previous = process.env.DEVELOPER_DIR;
    process.env.DEVELOPER_DIR = match.developerDir;
    logger.log(
      `   Switched DEVELOPER_DIR to ${match.developerDir} for this run (will reset after).`
    );
    return () => {
      if (previous === undefined) {
        delete process.env.DEVELOPER_DIR;
      } else {
        process.env.DEVELOPER_DIR = previous;
      }
    };
  }

  const activeDescription = active
    ? `Active toolchain is Xcode ${active}`
    : 'No active Xcode toolchain detected';
  const found =
    installed.length > 0
      ? `Found in /Applications: ${installed
          .map((t) => `Xcode ${t.xcode ?? '?'} at ${t.developerDir}`)
          .join('; ')}.`
      : `No Xcode-shaped apps found in /Applications.`;
  throw new Error(
    `${activeDescription}, but iOS prebuilds must be built with Xcode ${SUPPORTED_XCODE_VERSION}. ` +
      `Newer Swift compilers emit module interfaces that older consumer toolchains cannot parse, which breaks compilation for downstream consumers. ` +
      `${found} ` +
      `Install Xcode ${SUPPORTED_XCODE_VERSION} from https://developer.apple.com/download/all/ (it can coexist with other Xcodes), or rerun with \`--skip-ios-prebuilds\` if you don't need fresh artifacts.`
  );
}

const PRECOMPILE_BUILD_DIR = path.join(PACKAGES_DIR, 'precompile', '.build');
const FLAVORS = ['debug', 'release'] as const;

// Shared SPM deps source (monorepo) and per-package bundle destination (standalone).
// Resolver: precompiled_modules.rb's shared_spm_dep_source_base.
const SHARED_SPM_DEPS_SOURCE_DIR = '.spm-deps';
const SHARED_SPM_DEPS_BUNDLE_SUBPATH = path.join('prebuilds', 'spm-deps');

/**
 * Prompts before removing module prebuild caches. Mirrors `cleanupStaleBuildDirectories` on
 * the Android side: a list prompt (Yes / No / List all) that defaults to Yes, recursing to
 * print the full list on demand. Returns whether the caller should proceed with deletion.
 */
async function promptForPrebuildCleanup(moduleDirs: string[]): Promise<boolean> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      prefix: '🧹',
      message: chalk.cyan(
        `Found ${moduleDirs.length} module prebuild cache${
          moduleDirs.length === 1 ? '' : 's'
        } (packages/precompile/.build). Remove before rebuilding?`
      ),
      choices: [
        { name: 'Yes', value: 'yes' },
        { name: 'No', value: 'no' },
        { name: 'List all', value: 'list' },
      ],
      default: 'yes',
    },
  ]);

  if (action === 'list') {
    logger.log();
    for (const dir of moduleDirs) {
      logger.log('  ', chalk.gray(path.relative(EXPO_DIR, dir)));
    }
    logger.log();
    return promptForPrebuildCleanup(moduleDirs);
  }

  return action === 'yes';
}

/**
 * Removes every module's cached prebuild output under `packages/precompile/.build/<module>/`
 * so each publish regenerates its xcframeworks from current source.
 *
 * Why this matters: the prebuild pipeline is incremental and has NO reverse-dependency
 * invalidation. When a dependency's Swift interface changes (e.g. ExpoModulesCore's
 * `Promise`), a dependent whose own sources didn't change (e.g. ExpoSensors) is not rebuilt —
 * its cached xcframework is reused and bundled. The stale binary then references symbols the
 * rebuilt dependency no longer exports, so consumer apps abort at launch with a dyld "Symbol
 * not found" error. Wiping the per-module build dirs forces a clean rebuild.
 *
 * This mirrors `cleanupStaleBuildDirectories` on the Android side (which clears `*.cxx` and
 * `android/build`), including the confirmation prompt — it defaults to Yes, so a
 * non-interactive publish that accepts defaults still gets the clean rebuild.
 *
 * Preserves caches that don't depend on Expo module ABI, so publishes stay reasonably fast:
 * the shared SPM deps cache (`.build/.spm-deps/`, a dot-dir) and each package's downloaded
 * RN/Hermes artifact cache (`packages/<pkg>/.dependencies/`, which lives outside `.build/`).
 *
 * `buildDir` and `confirm` are injection seams for tests; production uses the real defaults.
 */
export async function cleanStaleModuleBuildDirsAsync(
  buildDir: string = PRECOMPILE_BUILD_DIR,
  confirm: (moduleDirs: string[]) => Promise<boolean> = promptForPrebuildCleanup
): Promise<void> {
  if (!fs.existsSync(buildDir)) {
    return; // Nothing built yet.
  }

  const entries = await fs.promises.readdir(buildDir, { withFileTypes: true });
  // Every non-dot child dir is a module build dir (including scoped dirs like `@expo`).
  // Dot-prefixed dirs (e.g. `.spm-deps`) are shared caches we intentionally keep.
  const moduleDirs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(buildDir, entry.name));

  if (moduleDirs.length === 0) {
    return;
  }

  if (!(await confirm(moduleDirs))) {
    logger.log('  ', 'Skipping cleanup of module prebuild caches.');
    return;
  }

  await runWithSpinner(
    `Clearing ${moduleDirs.length} module prebuild cache(s)`,
    () =>
      Promise.all(moduleDirs.map((dir) => fs.promises.rm(dir, { recursive: true, force: true }))),
    `Cleared ${moduleDirs.length} module prebuild cache(s)`
  );
}

/**
 * Removes the bundled `prebuilds/` directory from EVERY package being published — not just
 * those in `IOS_PREBUILD_PACKAGES` — before the copy step below repopulates it for the
 * currently-listed packages.
 *
 * Scanning every package, rather than only the listed ones, makes de-listing self-correcting:
 * when a package is dropped from `IOS_PREBUILD_PACKAGES`, a `prebuilds/` dir left over from a
 * prior build (when it was still listed) would otherwise be picked up by `npm pack` and ship a
 * stale binary. That is exactly how `expo-sensors@57.0.0` shipped a stale `ExpoSensors.xcframework`
 * after it was de-listed. Wiping all of them first means only packages the copy step actually
 * repopulates can ship a `prebuilds/` dir.
 *
 * `prebuilds/` is generated build output (never committed), so removing it is always safe.
 */
export async function clearBundledPrebuildsAsync(parcels: Parcel[]): Promise<void> {
  const dirs = parcels
    .map((parcel) => path.join(parcel.pkg.path, 'prebuilds'))
    .filter((dir) => fs.existsSync(dir));

  if (dirs.length === 0) {
    return;
  }

  await runWithSpinner(
    `Clearing bundled prebuilds/ from ${dirs.length} package(s)`,
    () => Promise.all(dirs.map((dir) => fs.promises.rm(dir, { recursive: true, force: true }))),
    `Cleared bundled prebuilds/ from ${dirs.length} package(s)`
  );
}

/**
 * Builds iOS xcframeworks for selected packages and bundles them into each package's
 * `prebuilds/` directory: per-product tarballs under `prebuilds/output/` and shared SPM
 * dep xcframeworks under `prebuilds/spm-deps/`. Both are picked up by `npm pack`.
 */
export const bundleIOSPrebuilds = new Task<TaskArgs>(
  {
    name: 'bundleIOSPrebuilds',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    if (options.skipIosPrebuilds) {
      logger.debug('\n📱 Skipping iOS prebuilds due to --skip-ios-prebuilds flag.');
      return;
    }

    logger.log('\n📱 Building iOS prebuilds...');

    const relevantParcels = IOS_PREBUILD_PACKAGES.filter((name) =>
      parcels.some((p) => p.pkg.packageName === name || p.pkg.packageSlug === name)
    );
    if (relevantParcels.length === 0) {
      logger.log('No iOS prebuild packages in publish set, skipping');
      return;
    }

    const restoreToolchain = await ensureSupportedToolchainAsync();

    try {
      // Prompt (defaulting to Yes) to clear module prebuild caches before rebuilding, so no
      // module ships a stale prebuilt binary. The pipeline is incremental with no
      // reverse-dependency invalidation, so a dependent's cached xcframework can otherwise lag
      // an ABI change in a dependency and crash consumer apps at launch. See
      // cleanStaleModuleBuildDirsAsync.
      await cleanStaleModuleBuildDirsAsync();

      const result = await runPrebuildPackagesAsync(relevantParcels, {
        clean: false,
        cleanCache: false,
        skipGenerate: false,
        skipArtifacts: false,
        skipBuild: false,
        skipCompose: false,
        skipVerify: false,
        verbose: false,
        // Shared SPM deps ship separately at <pkg>/prebuilds/spm-deps/ (see bundleSharedSpmDepsAsync).
        bundleSharedDeps: false,
      });

      if (result.exitCode !== 0) {
        logger.error(`iOS prebuild failed with exit code ${result.exitCode}`);
        if (result.errorLogPath) {
          logger.error(`Error log: ${result.errorLogPath}`);
        }

        const errorDetails = result.errors
          .map((e) => `  - [${e.packageName}/${e.productName}] ${e.stage}: ${e.error.message}`)
          .join('\n');
        const errorMessage = errorDetails
          ? `iOS prebuild pipeline failed:\n${errorDetails}`
          : 'iOS prebuild pipeline failed';
        throw new Error(errorMessage);
      }

      // Wipe every package's bundled prebuilds/ dir before repopulating, so a de-listed
      // package can't keep shipping a stale one (see clearBundledPrebuildsAsync). The loop
      // below only repopulates packages still in IOS_PREBUILD_PACKAGES.
      await clearBundledPrebuildsAsync(parcels);

      // Copy built tarballs into each package's prebuilds/ directory
      for (const pkgName of IOS_PREBUILD_PACKAGES) {
        const parcel = parcels.find(
          (p) => p.pkg.packageName === pkgName || p.pkg.packageSlug === pkgName
        );
        if (!parcel) {
          logger.warn(`Package ${pkgName} not found in parcels, skipping prebuild bundling`);
          continue;
        }

        await runWithSpinner(
          `Bundling iOS prebuilds into ${pkgName}`,
          async () => {
            for (const flavor of FLAVORS) {
              const srcDir = path.join(
                PRECOMPILE_BUILD_DIR,
                pkgName,
                'output',
                flavor,
                'xcframeworks'
              );
              const destDir = path.join(
                parcel.pkg.path,
                'prebuilds',
                'output',
                flavor,
                'xcframeworks'
              );

              if (!fs.existsSync(srcDir)) {
                logger.warn(`  No ${flavor} xcframeworks found at ${srcDir}`);
                continue;
              }

              await fs.promises.mkdir(destDir, { recursive: true });

              const files = await fs.promises.readdir(srcDir);
              for (const file of files) {
                if (file.endsWith('.tar.gz')) {
                  await fs.promises.copyFile(path.join(srcDir, file), path.join(destDir, file));
                }
              }
            }

            await bundleSharedSpmDepsAsync(parcel.pkg.path);
          },
          `Bundled iOS prebuilds into ${pkgName}`
        );
      }
    } finally {
      restoreToolchain();
    }
  }
);

// Copies each shared SPM xcframework this package declares (across all products in its
// spm.config.json) from .spm-deps/ into <packagePath>/prebuilds/spm-deps/<Name>/<flavor>/.
// Non-shared SPM packages (not present in .spm-deps/) are silently skipped.
async function bundleSharedSpmDepsAsync(packagePath: string): Promise<void> {
  const configPath = path.join(packagePath, 'spm.config.json');
  if (!fs.existsSync(configPath)) return;
  let config: any;
  try {
    config = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
  } catch (e) {
    logger.warn(`  Failed to parse ${configPath}: ${(e as Error).message}`);
    return;
  }
  const depNames = new Set<string>();
  for (const product of config.products ?? []) {
    for (const spm of product.spmPackages ?? []) {
      if (typeof spm?.productName === 'string') depNames.add(spm.productName);
    }
  }

  for (const depName of depNames) {
    for (const flavor of FLAVORS) {
      const srcXcfw = path.join(
        PRECOMPILE_BUILD_DIR,
        SHARED_SPM_DEPS_SOURCE_DIR,
        depName,
        flavor,
        `${depName}.xcframework`
      );
      if (!fs.existsSync(srcXcfw)) continue;
      const destXcfw = path.join(
        packagePath,
        SHARED_SPM_DEPS_BUNDLE_SUBPATH,
        depName,
        flavor,
        `${depName}.xcframework`
      );
      await fs.promises.rm(destXcfw, { recursive: true, force: true });
      await fs.promises.mkdir(path.dirname(destXcfw), { recursive: true });
      await fs.promises.cp(srcXcfw, destXcfw, { recursive: true });
    }
  }
}
