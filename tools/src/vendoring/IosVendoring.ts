import chalk from 'chalk';
import fs from 'fs-extra';
import glob from 'glob-promise';
import inquirer from 'inquirer';
import path from 'path';

import { podInstallAsync, readPodspecAsync } from '../CocoaPods';
import { IOS_DIR } from '../Constants';
import logger from '../Logger';
import { searchFilesAsync } from '../Utils';
import { copyVendoredFilesAsync } from './common';
import { VendoringModuleConfig } from './types';

export async function vendorAsync(
  sourceDirectory: string,
  targetDirectory: string,
  config: VendoringModuleConfig['ios'] = {}
): Promise<void> {
  const [podspecFile] = await glob('**/*.podspec', {
    cwd: sourceDirectory,
  });

  if (!podspecFile) {
    throw new Error('Missing `*.podspec` file!');
  }

  const podspec = await readPodspecAsync(path.join(sourceDirectory, podspecFile));

  // Get a list of source files specified by the podspec.
  const filesPatterns = ([] as string[]).concat(
    podspec.source_files,
    podspec.ios?.source_files ?? [],
    podspec.preserve_paths ?? []
  );
  const files = await searchFilesAsync(sourceDirectory, filesPatterns);

  await copyVendoredFilesAsync(files, {
    sourceDirectory,
    targetDirectory,
    transforms: config?.transforms ?? {},
  });

  // We may need to transform the podspec as well. As we have an access to its JSON representation,
  // it seems better to modify the object directly instead of string-transforming.
  config.mutatePodspec?.(podspec);

  // Save the dynamic ruby podspec as a static JSON file, so there is no need
  // to copy `package.json` files, which are often being read by the podspecs.
  const podspecJsonFile = podspecFile + '.json';
  await fs.outputJSON(path.join(targetDirectory, podspecJsonFile), podspec, {
    spaces: 2,
  });

  logger.log('📄 Generating %s', chalk.magenta(podspecJsonFile));

  if (await promptToReinstallPodsAsync()) {
    logger.log('♻️  Reinstalling pods at %s', chalk.magenta(IOS_DIR));
    await podInstallAsync(IOS_DIR, {
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
