/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Resolution, ResolutionContext } from 'metro-resolver';
import path from 'path';
import nodeResolve from 'resolve';

import { isNodeExternal } from './externals';
import { formatFileCandidates } from './formatFileCandidates';
import { CommandError } from '../../../utils/errors';

class FailedToResolvePathError extends Error {}

class ShimModuleError extends Error {}

export function createFastResolver({ preserveSymlinks }: { preserveSymlinks: boolean }) {
  const cachedExtensions: Map<string, readonly string[]> = new Map();

  function getAdjustedExtensions({
    metroSourceExtensions,
    platform,
    isNative,
  }: {
    metroSourceExtensions: readonly string[];
    platform: string | null;
    isNative: boolean;
  }): readonly string[] {
    const key = JSON.stringify({ metroSourceExtensions, platform, isNative });
    if (cachedExtensions.has(key)) {
      return cachedExtensions.get(key)!;
    }

    let output = metroSourceExtensions;
    if (platform) {
      const nextOutput: string[] = [];

      output.forEach((ext) => {
        nextOutput.push(`${platform}.${ext}`);
        if (isNative) {
          nextOutput.push(`native.${ext}`);
        }
        nextOutput.push(ext);
      });

      output = nextOutput;
    }

    output = Array.from(new Set<string>(output));

    // resolve expects these to start with a dot.
    output = output.map((ext) => `.${ext}`);

    cachedExtensions.set(key, output);

    return output;
  }

  function fastResolve(
    context: Pick<
      ResolutionContext,
      | 'unstable_enablePackageExports'
      | 'customResolverOptions'
      | 'sourceExts'
      | 'preferNativePlatform'
      | 'originModulePath'
      | 'getPackage'
      | 'nodeModulesPaths'
      | 'mainFields'
      | 'resolveAsset'
    >,
    moduleName: string,
    platform: string | null
  ): Resolution {
    // TODO: Support extraNodeModules for tsconfig basePath support
    // TODO: Support package exports import { resolve as resolveExports } from 'resolve.exports'
    // TODO: Support `resolver.blockList`
    if (context.unstable_enablePackageExports) {
      throw new CommandError('package exports are not supported with EXPO_USE_FAST_RESOLVER=1');
    }

    const environment = context.customResolverOptions?.environment;
    const isServer = environment === 'node';

    const extensions = getAdjustedExtensions({
      metroSourceExtensions: context.sourceExts,
      platform,
      isNative: context.preferNativePlatform,
    });

    let fp: string;

    try {
      fp = nodeResolve.sync(moduleName, {
        basedir: path.dirname(context.originModulePath),
        extensions,
        // Used to ensure files trace to packages instead of node_modules in expo/expo. This is how Metro works and
        // the app doesn't finish without it.
        preserveSymlinks,
        readPackageSync(readFileSync, pkgFile) {
          return (
            context.getPackage(pkgFile) ??
            JSON.parse(
              // @ts-expect-error
              readFileSync(pkgfile)
            )
          );
        },
        moduleDirectory: context.nodeModulesPaths,
        packageFilter(pkg) {
          // set the pkg.main to the first available field in context.mainFields
          for (const field of context.mainFields) {
            if (
              pkg[field] &&
              // object-inspect uses browser: {} in package.json
              typeof pkg[field] === 'string'
            ) {
              return {
                ...pkg,
                main: pkg[field],
              };
            }
          }
          return pkg;
        },

        pathFilter: isServer
          ? undefined
          : (pkg: any, _resolvedPath: string, relativePathIn: string): string => {
              let relativePath = relativePathIn;
              if (relativePath[0] !== '.') {
                relativePath = `./${relativePath}`;
              }

              const replacements = pkg.browser;
              if (replacements === undefined) {
                return '';
              }

              const mappedPath = replacements[relativePath];
              if (mappedPath === false) {
                throw new ShimModuleError();
              }
              return mappedPath;
            },

        // Not needed but added for parity...

        // @ts-ignore
        realpathSync: context.unstable_getRealPath,
      });

      if (!isServer && isNodeExternal(fp)) {
        // In this case, mock the file to use an empty module.
        return {
          type: 'empty',
        };
      }
    } catch (error: any) {
      if (error instanceof ShimModuleError) {
        return {
          type: 'empty',
        };
      }

      if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
        // TODO: Add improved error handling.
        throw new FailedToResolvePathError(
          'The module could not be resolved because no file or module matched the pattern:\n' +
            `  ${formatFileCandidates(
              {
                type: 'sourceFile',
                filePathPrefix: moduleName,
                candidateExts: extensions,
              },
              true
            )}\n\n`
        );
      }
      throw error;
    }

    if (context.sourceExts.some((ext) => fp.endsWith(ext))) {
      return {
        type: 'sourceFile',
        filePath: fp,
      };
    } else {
      // NOTE: platform extensions may not be supported on assets.

      if (platform === 'web') {
        // Skip multi-resolution on web/server bundles. Only consideration here is that
        // we may still need it in case the only image is a multi-resolution image.
        return {
          type: 'assetFiles',
          filePaths: [fp],
        };
      }

      const dirPath = path.dirname(fp);
      const extension = path.extname(fp);
      const basename = path.basename(fp, extension);
      return {
        type: 'assetFiles',
        // Support multi-resolution asset extensions...
        filePaths: context.resolveAsset(dirPath, basename, extension) ?? [fp],
      };
    }
  }

  return fastResolve;
}
