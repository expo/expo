import fs from 'fs';
import path from 'path';

import { loadRequestedParcels } from './loadRequestedParcels';
import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner, spawnAsync } from '../../Utils';
import { runPrebuildPackagesAsync } from '../../commands/PrebuildPackages';
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

/**
 * Packages whose iOS prebuilt xcframeworks should be bundled into the npm tarball.
 */
const IOS_PREBUILD_PACKAGES = [
  'expo-brownfield',
  'expo-camera',
  'expo-contacts',
  'expo-file-system',
  'expo-font',
  'expo-image',
  'expo-image-manipulator',
  'expo-live-photo',
  'expo-location',
  'expo-maps',
  'expo-media-library',
  'expo-modules-core',
  'expo-print',
  'expo-sensors',
  'expo-ui',
  'expo-video',
];

const PRECOMPILE_BUILD_DIR = path.join(PACKAGES_DIR, 'precompile', '.build');
const FLAVORS = ['debug', 'release'] as const;

// Shared SPM deps source (monorepo) and per-package bundle destination (standalone).
// Resolver: precompiled_modules.rb's shared_spm_dep_source_base.
const SHARED_SPM_DEPS_SOURCE_DIR = '.spm-deps';
const SHARED_SPM_DEPS_BUNDLE_SUBPATH = path.join('prebuilds', 'spm-deps');

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
