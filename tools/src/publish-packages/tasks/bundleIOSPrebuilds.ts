import fs from 'fs';
import path from 'path';

import { loadRequestedParcels } from './loadRequestedParcels';
import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { runPrebuildPackagesAsync } from '../../commands/PrebuildPackages';
import { CommandOptions, Parcel, TaskArgs } from '../types';

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
  //'expo-ui', // Until we have support for worklets (3rd party frameworks) in prebuilds, we can't include this package because it has a dependency on react-native-worklets
  'expo-video',
];

const PRECOMPILE_BUILD_DIR = path.join(PACKAGES_DIR, 'precompile', '.build');
const FLAVORS = ['debug', 'release'] as const;

/**
 * Builds iOS xcframeworks for selected packages and copies the output tarballs
 * into each package's `prebuilds/output/` directory so they are included in `npm pack`.
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

    const result = await runPrebuildPackagesAsync(relevantParcels, {
      clean: false,
      cleanCache: false,
      skipGenerate: false,
      skipArtifacts: false,
      skipBuild: false,
      skipCompose: false,
      skipVerify: false,
      verbose: false,
      bundleSharedDeps: true,
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
        },
        `Bundled iOS prebuilds into ${pkgName}`
      );
    }
  }
);
