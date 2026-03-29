import fs from 'fs';
import path from 'path';

import { loadRequestedParcels } from './loadRequestedParcels';
import { PACKAGES_DIR } from '../../Constants';
import { runPrebuildPackagesAsync } from '../../commands/PrebuildPackages';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';

/**
 * Packages whose iOS prebuilt xcframeworks should be bundled into the npm tarball.
 */
const IOS_PREBUILD_PACKAGES = ['expo-modules-core'];

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
  async (parcels: Parcel[]) => {
    logger.log('\n📱 Building iOS prebuilds...');
    const result = await runPrebuildPackagesAsync(IOS_PREBUILD_PACKAGES, {
      clean: false,
      cleanCache: false,
      skipGenerate: false,
      skipArtifacts: false,
      skipBuild: false,
      skipCompose: false,
      skipVerify: false,
      verbose: false,
    });

    if (result.exitCode !== 0) {
      logger.error(`iOS prebuild failed with exit code ${result.exitCode}`);
      if (result.errorLogPath) {
        logger.error(`Error log: ${result.errorLogPath}`);
      }
      throw new Error('iOS prebuild pipeline failed');
    }

    // Copy built tarballs into each package's prebuilds/ directory
    for (const pkgName of IOS_PREBUILD_PACKAGES) {
      const parcel = parcels.find((p) => p.pkg.packageName === pkgName);
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
