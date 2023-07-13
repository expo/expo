/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import { ConfigT as MetroConfig } from 'metro-config';
import { ResolutionContext } from 'metro-resolver';
import path from 'path';

import { globalMetroInstanceHack } from './MetroBundlerDevServer';
import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import { importMetroResolverFromProject } from './resolveFromProject';

const debug = require('debug')('expo:metro:withMetroResolvers') as typeof console.log;

export type MetroResolver = NonNullable<MetroConfig['resolver']['resolveRequest']>;

/** Expo Metro Resolvers can return `null` to skip without throwing an error. Metro Resolvers will throw either a `FailedToResolveNameError` or `FailedToResolvePathError`. */
export type ExpoCustomMetroResolver = (
  ...args: Parameters<MetroResolver>
) => ReturnType<MetroResolver> | null;

/** @returns `MetroResolver` utilizing the upstream `resolve` method. */
export function getDefaultMetroResolver(projectRoot: string): MetroResolver {
  const { resolve } = importMetroResolverFromProject(projectRoot);
  return (context: ResolutionContext, moduleName: string, platform: string | null) => {
    return resolve(context, moduleName, platform);
  };
}

function optionsKeyForContext(context: ResolutionContext) {
  const canonicalize = require('metro-core/src/canonicalize');

  // Compound key for the resolver cache
  return JSON.stringify(context.customResolverOptions ?? {}, canonicalize) ?? '';
}

/**
 * Extend the Metro config `resolver.resolveRequest` method with additional resolvers that can
 * exit early by returning a `Resolution` or skip to the next resolver by returning `null`.
 *
 * @param config Metro config.
 * @param projectRoot path to the project root used to resolve the default Metro resolver.
 * @param resolvers custom MetroResolver to chain.
 * @returns a new `MetroConfig` with the `resolver.resolveRequest` method chained.
 */
export function withMetroResolvers(
  config: MetroConfig,
  projectRoot: string,
  resolvers: ExpoCustomMetroResolver[]
): MetroConfig {
  debug(
    `Appending ${
      resolvers.length
    } custom resolvers to Metro config. (has custom resolver: ${!!config.resolver.resolveRequest})`
  );
  const originalResolveRequest =
    config.resolver.resolveRequest || getDefaultMetroResolver(projectRoot);

  function mutateResolutionError(
    error: Error,
    context: ResolutionContext,
    moduleName: string,
    platform: string | null
  ) {
    if (!globalMetroInstanceHack || !platform) {
      debug('Cannot mutate resolution error');
      return error;
    }

    // const
    // _graph

    // console.log(globalMetroInstanceHack?.getBundler().getDeltaBundler());
    // console.log(globalMetroInstanceHack?.getBundler());
    // console.log(depGraph);

    // const mapByResolverOptions = globalMetroInstanceHack?.getBundler().getBundler()
    //   ._depGraph._resolutionCache;
    const mapByOrigin = depGraph.get(optionsKeyForContext(context));
    const mapByPlatform = mapByOrigin?.get(platform);

    if (!mapByPlatform) {
      return error;
    }

    // collect all references inversely using some expensive lookup

    const getReferences = (origin: string) => {
      const matcher = new RegExp(
        escapePath(origin) +
          // Optional `(/index.[tj]sx?)?` at the end
          '(?:/index\\.[tjm]sx?)?$',
        'i'
      );
      const inverseOrigin: { origin: string; previous: string }[] = [];

      if (!mapByPlatform) {
        return inverseOrigin;
      }

      for (const [originKey, mapByTarget] of mapByPlatform) {
        // for (const [targetKey, resolutionWithPlatforms] of mapByTarget) {
        // const resolution = mapByTarget.get(platform);
        // if (!resolution) {
        //   continue;
        // }
        // console.log('res', resolution);
        // if (typeof resolution === 'string') {
        if (
          mapByTarget.has(origin)
          // resolution === origin
          // .match(matcher)
        ) {
          inverseOrigin.push({ origin: origin, previous: originKey });
        }
        //   } else {
        //     if (resolution?.type === 'sourceFile' && resolution.filePath.match(matcher)) {
        //       // console.log('foo', mapByTarget, targetKey, resolutionWithPlatforms, originKey);
        //       inverseOrigin.push({ origin: resolution.filePath, previous: originKey });
        //     }
        //   // }
        // }
      }

      return inverseOrigin;
    };
    const escapePath = (p: string) => {
      // Escape characters with special meaning either inside or outside character sets.
      // Use a simple backslash escape when it’s always valid, and a \unnnn escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
      return p.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
    };

    const pad = (num: number) => {
      return new Array(num).fill(' ').join('');
    };

    const root = config.server.unstable_serverRoot ?? config.projectRoot ?? projectRoot;

    type InverseDepResult = {
      origin: string;
      previous: InverseDepResult[];
    };
    const recurseBackWithLimit = (origin: string, limit: number, count: number = 0) => {
      const results: InverseDepResult = {
        origin,
        previous: [],
      };

      if (count >= limit) {
        return results;
      }

      const inverse = getReferences(origin);
      for (const match of inverse) {
        // console.log(pad(count) + '└ ' + path.relative(root, match.origin));

        // Use more qualified name if possible
        results.origin = match.origin;
        // Found entry point
        if (origin === match.previous) {
          continue;
        }
        results.previous.push(recurseBackWithLimit(match.previous, limit, count + 1));
      }
      return results;
    };

    const inverseTree = recurseBackWithLimit(
      context.originModulePath,
      // TODO: Do we need to expose this?
      35
    );

    if (inverseTree.previous.length > 0) {
      debug('Found inverse graph:', JSON.stringify(inverseTree, null, 2));
      let extraMessage = 'Inverse dependency graph:';
      // console.log('\n\nImport stack:');
      // console.log('\n\nInverse tree:');
      const printRecursive = (tree: InverseDepResult, depth: number = 0) => {
        extraMessage += '\n' + pad(depth) + '└ ' + path.relative(root, tree.origin);
        // console.log(pad(depth) + '└ ' + path.relative(root, tree.origin));
        for (const child of tree.previous) {
          printRecursive(child, depth + 1);
        }
      };
      printRecursive(inverseTree);

      error._expoImportStack = chalk.gray(extraMessage);
      // console.log(mapByOrigin, JSON.stringify(inverseTree, null, 2));
      // process.exit(0);
    } else {
      debug('Found no inverse tree for:', context.originModulePath);
    }

    return error;
  }

  const depGraph: Map<
    // custom options
    string,
    Map<
      // platform
      string,
      Map<
        // origin module name
        string,
        // required module name
        Set<string>
        // { origin: string; res: ReturnType<ExpoCustomMetroResolver> } | string
      >
    >
  > = new Map();

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest(context, moduleName, platform) {
        const storeResult = (res: NonNullable<ReturnType<ExpoCustomMetroResolver>>) => {
          if (!platform) return;

          const key = optionsKeyForContext(context);
          if (!depGraph.has(key)) depGraph.set(key, new Map());
          const mapByTarget = depGraph.get(key);
          if (!mapByTarget!.has(platform)) mapByTarget!.set(platform, new Map());
          const mapByPlatform = mapByTarget!.get(platform);
          if (!mapByPlatform!.has(context.originModulePath))
            mapByPlatform!.set(context.originModulePath, new Set());
          const setForModule = mapByPlatform!.get(context.originModulePath)!;

          const qualifiedModuleName = res.type === 'sourceFile' ? res.filePath : moduleName;
          setForModule.add(qualifiedModuleName);

          // if (!mapByTarget.has(context.originModulePath)) {
          //   mapByTarget.set(context.originModulePath, new Map());
          // // }
          // const mapByModule = mapByTarget.get(context.originModulePath) ?? [];

          // const mapByPlatform = mapByTarget.get(context.originModulePath) ?? [];

          // if (!mapByPlatform.has(platform)) {
          //   mapByPlatform.set(platform, qualifiedModuleName);
          // }
        };

        const universalContext = {
          ...context,
          preferNativePlatform: platform !== 'web',
        };

        try {
          for (const resolver of resolvers) {
            try {
              const resolution = resolver(universalContext, moduleName, platform);
              if (resolution) {
                storeResult(resolution);
                return resolution;
              }
            } catch (error: any) {
              // // If no user-defined resolver, use Expo's default behavior.
              // if (!config.resolver.resolveRequest) {
              //   throw error;
              // }

              // If the error is directly related to a resolver not being able to resolve a module, then
              // we can ignore the error and try the next resolver. Otherwise, we should throw the error.
              const isResolutionError =
                isFailedToResolveNameError(error) || isFailedToResolvePathError(error);
              if (!isResolutionError) {
                throw error;
              }
              debug(
                `Custom resolver threw: ${error.constructor.name}. (module: ${moduleName}, platform: ${platform})`
              );
            }
          }
          // If we haven't returned by now, use the original resolver or upstream resolver.
          const res = originalResolveRequest(universalContext, moduleName, platform);
          storeResult(res);
          return res;
        } catch (error: any) {
          throw mutateResolutionError(error, universalContext, moduleName, platform);
        }
      },
    },
  };
}
