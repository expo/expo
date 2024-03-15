/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { Resolution, ResolutionContext } from 'metro-resolver';
import path from 'path';

import jestResolver from './createJResolver';
import { isNodeExternal } from './externals';
import { formatFileCandidates } from './formatFileCandidates';
import { isServerEnvironment } from '../middleware/metroOptions';

export class FailedToResolvePathError extends Error {
  // Added to ensure the error is matched by our tooling.
  // TODO: Test that this matches `isFailedToResolvePathError`
  candidates = {};
}

class ShimModuleError extends Error {}

const debug = require('debug')('expo:metro:resolve') as typeof console.log;

const realpathFS =
  process.platform !== 'win32' && fs.realpathSync && typeof fs.realpathSync.native === 'function'
    ? fs.realpathSync.native
    : fs.realpathSync;

function realpathSync(x: string) {
  try {
    return realpathFS(x);
  } catch (realpathErr: any) {
    if (realpathErr.code !== 'ENOENT') {
      throw realpathErr;
    }
  }
  return x;
}

export function createFastResolver({
  preserveSymlinks,
  blockList,
}: {
  preserveSymlinks: boolean;
  blockList: RegExp[];
}) {
  debug('Creating with settings:', { preserveSymlinks, blockList });
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
      | 'unstable_conditionNames'
      | 'unstable_conditionsByPlatform'
    >,
    moduleName: string,
    platform: string | null
  ): Resolution {
    const environment = context.customResolverOptions?.environment;
    const isServer = isServerEnvironment(environment);

    const extensions = getAdjustedExtensions({
      metroSourceExtensions: context.sourceExts,
      platform,
      isNative: context.preferNativePlatform,
    }) as string[];

    let fp: string;

    const conditions = context.unstable_enablePackageExports
      ? [
          ...new Set([
            'default',
            ...context.unstable_conditionNames,
            ...(platform != null ? context.unstable_conditionsByPlatform[platform] ?? [] : []),
          ]),
        ]
      : [];
    try {
      fp = jestResolver(moduleName, {
        blockList,
        enablePackageExports: context.unstable_enablePackageExports,
        basedir: path.dirname(context.originModulePath),
        paths: context.nodeModulesPaths.length ? (context.nodeModulesPaths as string[]) : undefined,
        extensions,
        conditions,
        realpathSync(file: string): string {
          let metroRealPath: string | null = null;

          try {
            // @ts-expect-error: Missing on type.
            metroRealPath = context.unstable_getRealPath?.(file);
          } catch (error: any) {
            // If invariant
            if (error.message !== 'Unexpectedly escaped traversal') {
              throw error;
            }
          }

          if (metroRealPath == null && preserveSymlinks) {
            return realpathSync(file);
          }
          return metroRealPath ?? file;
        },
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
        // Used to ensure files trace to packages instead of node_modules in expo/expo. This is how Metro works and
        // the app doesn't finish without it.
        preserveSymlinks,
        readPackageSync(readFileSync, pkgFile) {
          return context.getPackage(pkgFile) ?? JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
        },
        includeCoreModules: isServer,

        pathFilter:
          // Disable `browser` field for server environments.
          isServer
            ? undefined
            : // Enable `browser` field support
              (pkg: any, _resolvedPath: string, relativePathIn: string): string => {
                let relativePath = relativePathIn;
                if (relativePath[0] !== '.') {
                  relativePath = `./${relativePath}`;
                }

                const replacements = pkg.browser;
                if (replacements === undefined) {
                  return '';
                }

                // TODO: Probably use a better extension matching system here.
                // This was added for `uuid/v4` -> `./lib/rng` -> `./lib/rng-browser.js`
                const mappedPath = replacements[relativePath] ?? replacements[relativePath + '.js'];
                if (mappedPath === false) {
                  throw new ShimModuleError();
                }
                return mappedPath;
              },
      });
    } catch (error: any) {
      if (error instanceof ShimModuleError) {
        return {
          type: 'empty',
        };
      }

      if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
        if (isNodeExternal(moduleName)) {
          // In this case, mock the file to use an empty module.
          return {
            type: 'empty',
          };
        }

        debug({ moduleName, platform, conditions, isServer, preserveSymlinks }, context);

        throw new FailedToResolvePathError(
          'The module could not be resolved because no file or module matched the pattern:\n' +
            `  ${formatFileCandidates(
              {
                type: 'sourceFile',
                filePathPrefix: moduleName,
                candidateExts: extensions,
              },
              true
            )}\n\nFrom:\n  ${context.originModulePath}\n`
        );
      }
      throw error;
    }

    if (context.sourceExts.some((ext) => fp.endsWith(ext))) {
      return {
        type: 'sourceFile',
        filePath: fp,
      };
    }

    if (isNodeExternal(fp)) {
      if (isServer) {
        return {
          type: 'sourceFile',
          filePath: fp,
        };
      }
      // NOTE: This shouldn't happen, the module should throw.
      // Mock non-server built-in modules to empty.
      return {
        type: 'empty',
      };
    }

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

  return fastResolve;
}
