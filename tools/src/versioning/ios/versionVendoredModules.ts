import chalk from 'chalk';
import fs from 'fs-extra';
import glob from 'glob-promise';
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
  const versionedDir = vendoredDirectoryForSDK(sdkNumber);
  let vendoredModuleNames = await getVendoredModuleNamesAsync(unversionedDir);
  if (filterModules) {
    vendoredModuleNames = vendoredModuleNames.filter((name) => filterModules.includes(name));
  }

  for (const name of vendoredModuleNames) {
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
 * Gets the library name of each vendored module in a specific directory.
 */
async function getVendoredModuleNamesAsync(directory: string): Promise<string[]> {
  const vendoredPodspecPaths = await glob(`**/*.podspec.json`, {
    cwd: directory,
    nodir: true,
    realpath: true,
  });

  const podspecPattern = new RegExp(`${directory}/(.*)/.*podspec.json`, 'i');

  return vendoredPodspecPaths.reduce((result, podspecPath) => {
    const moduleName = podspecPath.match(podspecPattern);
    if (moduleName) {
      result.push(moduleName[1]);
    }
    return result;
  }, [] as string[]);
}

/**
 * Removes the directory with vendored modules for given SDK number.
 */
export async function removeVersionedVendoredModulesAsync(sdkNumber: number): Promise<void> {
  const versionedDir = vendoredDirectoryForSDK(sdkNumber);
  await fs.remove(versionedDir);
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
        find: /\b(RCT|RNC|RNG|RNR|REA|RNS)([^/]*\.)(h|m|mm)/,
        replaceWith: `${prefix}$1$2$3`,
      },
    ],
    content: [
      {
        paths: '*.podspec.json',
        find: /"name": "([\w-]+)"/,
        replaceWith: `"name": "${prefix}$1"`,
      },
      {
        // Prefixes `React` with word-boundary and also in `insertReactSubview`, `removeReactSubview`.
        find: /(\b|insert|remove)(React)/g,
        replaceWith: `$1${prefix}$2`,
      },
      {
        find: /\b(RCT|RNC|RNG|RNR|REA|RNS)(\w+)\b/g,
        replaceWith: `${prefix}$1$2`,
      },
      {
        find: /facebook::/g,
        replaceWith: `${prefix}facebook::`,
      },
      {
        find: /react::/g,
        replaceWith: `${prefix}React::`,
      },
      {
        find: /using namespace (facebook|react)/g,
        replaceWith: (_, p1) => {
          return `using namespace ${prefix}${p1 === 'react' ? 'React' : p1}`;
        },
      },
      {
        // Objective-C only, see the comment in the rule below.
        paths: '*.{h,m,mm}',
        find: /r(eactTag|eactSubviews|eactSuperview|eactViewController|eactSetFrame|eactAddControllerToClosestParent|eactZIndex)/gi,
        replaceWith: `${prefix}R$1`,
      },
      {
        // Swift translates uppercased letters at the beginning of the method name to lowercased letters, we must comply with it.
        paths: '*.swift',
        find: /r(eactTag|eactSubviews|eactSuperview|eactViewController|eactSetFrame|eactAddControllerToClosestParent|eactZIndex)/gi,
        replaceWith: (_, p1) => `${prefix.toLowerCase()}R${p1}`,
      },
      {
        find: /<jsi\/(.*)\.h>/,
        replaceWith: `<${prefix}jsi/${prefix}$1.h>`,
      },
      {
        find: /(JSCExecutorFactory|HermesExecutorFactory)\.h/g,
        replaceWith: `${prefix}$1.h`,
      },
      {
        find: /viewForReactTag/g,
        replaceWith: `viewFor${prefix}ReactTag`,
      },
      {
        find: /isReactRootView/g,
        replaceWith: `is${prefix}ReactRootView`,
      },
      {
        // Prefix only unindented `@objc` (notice `^` and `m` flag in the pattern). Method names shouldn't get prefixed.
        paths: '*.swift',
        find: /^@objc\(([^)]+)\)/gm,
        replaceWith: `@objc(${prefix}$1)`,
      },
      {
        paths: '*.podspec.json',
        find: new RegExp(`${prefix}React-${prefix}RCT`, 'g'),
        replaceWith: `${prefix}React-RCT`,
      },
      {
        paths: '*.podspec.json',
        find: new RegExp(`${prefix}React-Core\\/${prefix}RCT`, 'g'),
        replaceWith: `${prefix}React-Core/RCT`,
      },
    ],
  };
}

/**
 * Returns the vendored directory for given SDK number.
 */
function vendoredDirectoryForSDK(sdkNumber: number): string {
  return path.join(IOS_VENDORED_DIR, `sdk${sdkNumber}`);
}
