import { Command } from '@expo/commander';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

import logger from '../Logger';
import { Package, getPackageByName } from '../Packages';
import {
  buildFrameworksForProjectAsync,
  cleanTemporaryFilesAsync,
  cleanFrameworksAsync,
  generateXcodeProjectSpecAsync,
  PACKAGES_TO_PREBUILD,
} from '../prebuilds/Prebuilder';
import XcodeProject from '../prebuilds/XcodeProject';

type ActionOptions = {
  removeArtifacts: boolean;
  cleanCache: boolean;
  generateSpecs: boolean;
};

async function main(packageNames: string[], options: ActionOptions) {
  const filteredPackageNames =
    packageNames.length > 0
      ? packageNames.filter((name) => PACKAGES_TO_PREBUILD.includes(name))
      : PACKAGES_TO_PREBUILD;

  if (options.cleanCache) {
    logger.info('🧹 Cleaning shared derived data directory');
    await XcodeProject.cleanBuildFolderAsync();
  }

  const packages = filteredPackageNames.map(getPackageByName).filter(Boolean) as Package[];

  if (options.removeArtifacts) {
    logger.info('🧹 Removing existing artifacts');
    await cleanFrameworksAsync(packages);
    // Stop here, it doesn't make much sense to build them again ;)
    return;
  }

  for (const pkg of packages) {
    logger.info(`📦 Prebuilding ${chalk.green(pkg.packageName)}`);

    const startTime = performance.now();
    const xcodeProject = await generateXcodeProjectSpecAsync(pkg);
    const podspec = await pkg.getPodspecAsync();

    if (!options.generateSpecs && podspec) {
      await buildFrameworksForProjectAsync(podspec, xcodeProject);
      await cleanTemporaryFilesAsync(podspec, xcodeProject);
    }

    const endTime = performance.now();
    const timeDiff = (endTime - startTime) / 1000;
    logger.success('   Finished in: %s\n', chalk.magenta(timeDiff.toFixed(2) + 's'));
  }
}

export default (program: Command) => {
  program
    .command('prebuild-packages [packageNames...]')
    .description('Generates `.xcframework` artifacts for iOS packages.')
    .alias('prebuild')
    .option('-r, --remove-artifacts', 'Removes `.xcframework` artifacts for given packages.', false)
    .option('-c, --clean-cache', 'Cleans the shared derived data folder before prebuilding.', false)
    .option('-g, --generate-specs', 'Only generates project specs', false)
    .asyncAction(main);
};
