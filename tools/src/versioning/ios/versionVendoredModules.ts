import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { IOS_DIR } from '../../Constants';
import logger from '../../Logger';
import { copyFileWithTransformsAsync } from '../../Transforms';
import { FileTransforms } from '../../Transforms.types';
import { searchFilesAsync } from '../../Utils';
import vendoredModulesTransforms from './transforms/vendoredModulesTransforms';

const IOS_VENDORED_DIR = path.join(IOS_DIR, 'vendored');

/**
 * Versions iOS vendored modules.
 */
export async function versionVendoredModulesAsync(
  sdkNumber: number,
  filterModules: string[] | null
): Promise<void> {
  const prefix = `ABI${sdkNumber}_0_0`;
  const config = vendoredModulesTransforms(prefix);
  const baseTransforms = baseTransformsFactory(prefix);
  const unversionedDir = path.join(IOS_VENDORED_DIR, 'unversioned');
  const versionedDir = path.join(IOS_VENDORED_DIR, `sdk${sdkNumber}`);
  const sourceDirents = (await fs.readdir(unversionedDir, { withFileTypes: true })).filter(
    (dirent) => {
      return dirent.isDirectory() && (!filterModules || filterModules.includes(dirent.name));
    }
  );

  for (const { name } of sourceDirents) {
    logger.info('🔃 Versioning vendored module %s', chalk.green(name));

    const moduleConfig = config[name];
    const sourceDirectory = path.join(unversionedDir, name);
    const targetDirectory = path.join(versionedDir, name);
    const files = await searchFilesAsync(sourceDirectory, '**');

    await fs.remove(targetDirectory);

    for (const sourceFile of files) {
      await copyFileWithTransformsAsync({
        sourceFile,
        sourceDirectory,
        targetDirectory,
        transforms: {
          path: [...baseTransforms.path, ...(moduleConfig?.path ?? [])],
          content: [...baseTransforms.content, ...(moduleConfig?.content ?? [])],
        },
      });
    }
  }
}

/**
 * Generates base transforms to apply for all vendored modules.
 */
function baseTransformsFactory(prefix: string): Required<FileTransforms> {
  return {
    path: [
      {
        find: /([^/]+\.podspec\.json)$\b/,
        replaceWith: `${prefix}$1`,
      },
      {
        find: /\b(RNC[^/]*\.)(h|m|mm)/,
        replaceWith: `${prefix}$1$2`,
      },
    ],
    content: [
      {
        paths: '*.podspec.json',
        find: /"name": "([\w-]+)"/,
        replaceWith: `"name": "${prefix}$1"`,
      },
      {
        find: /\b(React)/g,
        replaceWith: `${prefix}$1`,
      },
      {
        find: /\b(RCT|RNC)(\w+)\b/g,
        replaceWith: `${prefix}$1$2`,
      },
      {
        paths: '*.swift',
        find: /@objc\(([^)]+)\)/g,
        replaceWith: `@objc(${prefix}$1)`,
      },
    ],
  };
}
