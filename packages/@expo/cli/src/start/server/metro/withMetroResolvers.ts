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

import { env } from '../../../utils/env';
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
    if (!env.EXPO_METRO_UNSTABLE_ERRORS || !platform) {
      debug('Cannot mutate resolution error');
      return error;
    }

    const mapByOrigin = depGraph.get(optionsKeyForContext(context));
    const mapByPlatform = mapByOrigin?.get(platform);

    if (!mapByPlatform) {
      return error;
    }

    // collect all references inversely using some expensive lookup

    const getReferences = (origin: string) => {
      const inverseOrigin: { origin: string; previous: string; request: string }[] = [];

      if (!mapByPlatform) {
        return inverseOrigin;
      }

      for (const [originKey, mapByTarget] of mapByPlatform) {
        // search comparing origin to path

        const found = [...mapByTarget.values()].find((resolution) => resolution.path === origin);
        if (found) {
          inverseOrigin.push({
            origin,
            previous: originKey,
            request: found.request,
          });
        }
      }

      return inverseOrigin;
    };

    const pad = (num: number) => {
      return new Array(num).fill(' ').join('');
    };

    const root = config.server?.unstable_serverRoot ?? config.projectRoot ?? projectRoot;

    type InverseDepResult = {
      origin: string;
      request: string;
      previous: InverseDepResult[];
    };
    const recurseBackWithLimit = (
      req: { origin: string; request: string },
      limit: number,
      count: number = 0
    ) => {
      const results: InverseDepResult = {
        origin: req.origin,
        request: req.request,
        previous: [],
      };

      if (count >= limit) {
        return results;
      }

      const inverse = getReferences(req.origin);
      for (const match of inverse) {
        // Use more qualified name if possible
        // results.origin = match.origin;
        // Found entry point
        if (req.origin === match.previous) {
          continue;
        }
        results.previous.push(
          recurseBackWithLimit({ origin: match.previous, request: match.request }, limit, count + 1)
        );
      }
      return results;
    };

    const inverseTree = recurseBackWithLimit(
      { origin: context.originModulePath, request: moduleName },
      // TODO: Do we need to expose this?
      35
    );

    if (inverseTree.previous.length > 0) {
      debug('Found inverse graph:', JSON.stringify(inverseTree, null, 2));
      let extraMessage = chalk.bold('Import stack:');
      const printRecursive = (tree: InverseDepResult, depth: number = 0) => {
        let filename = path.relative(root, tree.origin);
        if (filename.match(/\?ctx=[\w\d]+$/)) {
          filename = filename.replace(/\?ctx=[\w\d]+$/, chalk.dim(' (require.context)'));
        } else {
          let formattedRequest = chalk.green(`"${tree.request}"`);

          if (
            // If bundling for web and the import is pulling internals from outside of react-native
            // then mark it as an invalid import.
            platform === 'web' &&
            !/^(node_modules\/)?react-native\//.test(filename) &&
            tree.request.match(/^react-native\/.*/)
          ) {
            formattedRequest =
              formattedRequest +
              chalk`\n          {yellow Importing react-native internals is not supported on web.}`;
          }

          filename = filename + chalk`\n{gray  |} {cyan import} ${formattedRequest}\n`;
        }
        let line = '\n' + pad(depth) + chalk.gray(' ') + filename;
        if (filename.match(/node_modules/)) {
          line = chalk.gray(
            // Bold the node module name
            line.replace(/node_modules\/([^/]+)/, (_match, p1) => {
              return 'node_modules/' + chalk.bold(p1);
            })
          );
        }
        extraMessage += line;
        for (const child of tree.previous) {
          printRecursive(
            child,
            // Only add depth if there are multiple children
            tree.previous.length > 1 ? depth + 1 : depth
          );
        }
      };
      printRecursive(inverseTree);

      // @ts-expect-error
      error._expoImportStack = extraMessage;
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
        Set<{
          // required module name
          path: string;
          // This isn't entirely accurate since a module can be imported multiple times in a file,
          // and use different names. But it's good enough for now.
          request: string;
        }>
      >
    >
  > = new Map();

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest(context, moduleName, platform) {
        const storeResult = (res: NonNullable<ReturnType<ExpoCustomMetroResolver>>) => {
          if (!env.EXPO_METRO_UNSTABLE_ERRORS || !platform) return;

          const key = optionsKeyForContext(context);
          if (!depGraph.has(key)) depGraph.set(key, new Map());
          const mapByTarget = depGraph.get(key);
          if (!mapByTarget!.has(platform)) mapByTarget!.set(platform, new Map());
          const mapByPlatform = mapByTarget!.get(platform);
          if (!mapByPlatform!.has(context.originModulePath))
            mapByPlatform!.set(context.originModulePath, new Set());
          const setForModule = mapByPlatform!.get(context.originModulePath)!;

          const qualifiedModuleName = res?.type === 'sourceFile' ? res.filePath : moduleName;
          setForModule.add({ path: qualifiedModuleName, request: moduleName });
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
              // If no user-defined resolver, use Expo's default behavior.
              // This prevents extraneous resolution attempts on failure.
              if (!config.resolver.resolveRequest) {
                throw error;
              }

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
