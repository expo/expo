/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import type {
  ResolutionContext,
  CustomResolutionContext,
  CustomResolver,
} from '@expo/metro/metro-resolver';
import { resolve as metroResolver } from '@expo/metro/metro-resolver';

import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';

const debug = require('debug')('expo:metro:withMetroResolvers') as typeof console.log;

export type { CustomResolver as MetroResolver };

/** Expo Metro Resolvers can return `null` to skip without throwing an error. Metro Resolvers will throw either a `FailedToResolveNameError` or `FailedToResolvePathError`. */
export type ExpoCustomMetroResolver = (
  ...args: Parameters<CustomResolver>
) => ReturnType<CustomResolver> | null;

/** @returns `MetroResolver` utilizing the upstream `resolve` method. */
export function getDefaultMetroResolver(projectRoot: string): CustomResolver {
  return (context: ResolutionContext, moduleName: string, platform: string | null) => {
    return metroResolver(context, moduleName, platform);
  };
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
  inputResolvers: (ExpoCustomMetroResolver | undefined)[]
): MetroConfig {
  const resolvers = inputResolvers.filter((x) => x != null);
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
                  `Custom resolver (${resolver.name || '<anonymous>'}) threw: ${error.constructor.name}. (module: ${moduleName}, platform: ${platform}, env: ${ctx.customResolverOptions?.environment}, origin: ${ctx.originModulePath})`
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
