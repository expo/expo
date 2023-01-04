/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ConfigT as MetroConfig } from 'metro-config';
import { ResolutionContext } from 'metro-resolver';

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

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest(...args: Parameters<MetroResolver>) {
        for (const resolver of resolvers) {
          try {
            const resolution = resolver(...args);
            if (resolution) {
              return resolution;
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
              `Custom resolver threw: ${error.constructor.name}. (module: ${args[1]}, platform: ${args[2]})`
            );
          }
        }
        // If we haven't returned by now, use the original resolver or upstream resolver.
        return originalResolveRequest(...args);
      },
    },
  };
}
