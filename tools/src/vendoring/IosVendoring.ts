import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import inquirer from 'inquirer';
import path from 'path';

import { copyVendoredFilesAsync } from './common';
import { VendoringModuleConfig } from './types';
import { podInstallAsync, Podspec, readPodspecAsync } from '../CocoaPods';
import { EXPO_GO_IOS_DIR } from '../Constants';
import logger from '../Logger';
import { arrayize, searchFilesAsync } from '../Utils';

export async function vendorAsync(
  sourceDirectory: string,
  targetDirectory: string,
  config: VendoringModuleConfig['ios'] = {}
): Promise<void> {
  const [podspecFile] = await glob('**/*.podspec', {
    cwd: sourceDirectory,
    ignore: config.excludeFiles,
  });

  if (!podspecFile) {
    throw new Error('Missing `*.podspec` file!');
  }

  let podspecPath = path.join(sourceDirectory, podspecFile);
  if (config.preReadPodspecHookAsync) {
    podspecPath = await config.preReadPodspecHookAsync(podspecPath);
  }
  const podspec = await readPodspecAsync(podspecPath);

  // Get a list of source files specified by the podspec.
  const filesPatterns = createFilesPatterns(podspec);
  const files = await searchFilesAsync(sourceDirectory, filesPatterns);

  await copyVendoredFilesAsync(files, {
    sourceDirectory,
    targetDirectory,
    transforms: config?.transforms ?? {},
  });

  // We may need to transform the podspec as well. As we have an access to its JSON representation,
  // it seems better to modify the object directly instead of string-transforming.
  await config.mutatePodspec?.(podspec, sourceDirectory, targetDirectory);

  // Save the dynamic ruby podspec as a static JSON file, so there is no need
  // to copy `package.json` files, which are often being read by the podspecs.
  const podspecJsonFile = podspecFile + '.json';
  await fs.outputJSON(path.join(targetDirectory, podspecJsonFile), podspec, {
    spaces: 2,
  });

  logger.log('📄 Generating %s', chalk.magenta(podspecJsonFile));

  if (await promptToReinstallPodsAsync()) {
    logger.log('♻️  Reinstalling pods at %s', chalk.magenta(EXPO_GO_IOS_DIR));
    await podInstallAsync(EXPO_GO_IOS_DIR, {
      noRepoUpdate: true,
    });
  }
}

/**
 * Asks whether to reinstall pods.
 */
async function promptToReinstallPodsAsync(): Promise<boolean> {
  if (!process.env.CI) {
    return true;
  }
  const { reinstall } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'reinstall',
      prefix: '❔',
      message: 'Do you want to reinstall pods?',
    },
  ]);
  return reinstall;
}

function createFilesPatterns(podspec: Podspec): string[] {
  let result = ([] as string[]).concat(
    podspec.source_files,
    podspec.ios?.source_files ?? [],
    podspec.preserve_paths ?? []
  );

  const subspecs = podspec.subspecs ?? [];
  const podspecDefaultSubspecsArray = podspec.default_subspecs
    ? arrayize(podspec.default_subspecs)
    : null;
  const defaultSubspecs = podspecDefaultSubspecsArray
    ? subspecs.filter((spec) => podspecDefaultSubspecsArray.includes(spec.name))
    : subspecs;
  for (const spec of defaultSubspecs) {
    result = result.concat(
      spec.source_files,
      spec.ios?.source_files ?? [],
      spec.preserve_paths ?? []
    );
  }

  return result.filter(Boolean);
}
