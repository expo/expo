/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import { ConfigT as MetroConfig } from 'metro-config';
import type { ResolutionContext, CustomResolutionContext } from 'metro-resolver';
import * as metroResolver from 'metro-resolver';
import path from 'path';

import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import { env } from '../../../utils/env';

const debug = require('debug')('expo:metro:withMetroResolvers') as typeof console.log;

export type MetroResolver = NonNullable<MetroConfig['resolver']['resolveRequest']>;

/** Expo Metro Resolvers can return `null` to skip without throwing an error. Metro Resolvers will throw either a `FailedToResolveNameError` or `FailedToResolvePathError`. */
export type ExpoCustomMetroResolver = (
  ...args: Parameters<MetroResolver>
) => ReturnType<MetroResolver> | null;

/** @returns `MetroResolver` utilizing the upstream `resolve` method. */
export function getDefaultMetroResolver(projectRoot: string): MetroResolver {
  return (context: ResolutionContext, moduleName: string, platform: string | null) => {
    return metroResolver.resolve(context, moduleName, platform);
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
 * @param resolvers custom MetroResolver to chain.
 * @returns a new `MetroConfig` with the `resolver.resolveRequest` method chained.
 */
export function withMetroResolvers(
  config: MetroConfig,
  resolvers: ExpoCustomMetroResolver[]
): MetroConfig {
  debug(
    `Appending ${
      resolvers.length
    } custom resolvers to Metro config. (has custom resolver: ${!!config.resolver?.resolveRequest})`
  );
  // const hasUserDefinedResolver = !!config.resolver?.resolveRequest;
  // const defaultResolveRequest = getDefaultMetroResolver(projectRoot);
  const originalResolveRequest = config.resolver?.resolveRequest;

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest(context, moduleName, platform) {
        const upstreamResolveRequest = context.resolveRequest;

        const universalContext = {
          ...context,
          resolveRequest(
            ctx: CustomResolutionContext,
            moduleName: string,
            platform: string | null
          ) {
            for (const resolver of resolvers) {
              try {
                const res = resolver(ctx, moduleName, platform);
                if (res) {
                  return res;
                }
              } catch (error: any) {
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
            return upstreamResolveRequest(ctx, moduleName, platform);
          },
        };

        // If the user defined a resolver, run it first and depend on the documented
        // chaining logic: https://facebook.github.io/metro/docs/resolution/#resolution-algorithm
        //
        // config.resolver.resolveRequest = (context, moduleName, platform) => {
        //
        //  // Do work...
        //
        //  return context.resolveRequest(context, moduleName, platform);
        // };
        const firstResolver = originalResolveRequest ?? universalContext.resolveRequest;
        return firstResolver(universalContext, moduleName, platform);
      },
    },
  };
}

/**
 * Hook into the Metro resolver chain and mutate the context so users can resolve against our custom assumptions.
 * For example, this will set `preferNativePlatform` to false when bundling for web.
 * */
export function withMetroMutatedResolverContext(
  config: MetroConfig,
  getContext: (
    ctx: CustomResolutionContext,
    moduleName: string,
    platform: string | null
  ) => CustomResolutionContext
): MetroConfig {
  const defaultResolveRequest = getDefaultMetroResolver(config.projectRoot);
  const originalResolveRequest = config.resolver?.resolveRequest;

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest(context, moduleName, platform) {
        const universalContext = getContext(context, moduleName, platform);
        const firstResolver =
          originalResolveRequest ?? universalContext.resolveRequest ?? defaultResolveRequest;
        return firstResolver(universalContext, moduleName, platform);
      },
    },
  };
}

export function withMetroErrorReportingResolver(config: MetroConfig): MetroConfig {
  if (!env.EXPO_METRO_UNSTABLE_ERRORS) {
    return config;
  }

  const originalResolveRequest = config.resolver?.resolveRequest;

  function mutateResolutionError(
    error: Error,
    context: ResolutionContext,
    moduleName: string,
    platform: string | null
  ) {
    if (!platform) {
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

    const root = config.server?.unstable_serverRoot ?? config.projectRoot;

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
          if (!platform) return;

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

        // If the user defined a resolver, run it first and depend on the documented
        // chaining logic: https://facebook.github.io/metro/docs/resolution/#resolution-algorithm
        //
        // config.resolver.resolveRequest = (context, moduleName, platform) => {
        //
        //  // Do work...
        //
        //  return context.resolveRequest(context, moduleName, platform);
        // };
        try {
          const firstResolver = originalResolveRequest ?? context.resolveRequest;
          const res = firstResolver(context, moduleName, platform);
          storeResult(res);
          return res;
        } catch (error: any) {
          throw mutateResolutionError(error, context, moduleName, platform);
        }
      },
    },
  };
}
