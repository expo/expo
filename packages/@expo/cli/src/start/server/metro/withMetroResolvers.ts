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
import chalk from 'chalk';
import path from 'path';
import { stripVTControlCharacters } from 'util';

import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import { env } from '../../../utils/env';

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

function optionsKeyForContext(context: ResolutionContext) {
  const canonicalize: typeof import('@expo/metro/metro-core/canonicalize').default = require('@expo/metro/metro-core/canonicalize');
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
    const inputPlatform = platform ?? 'null';

    const mapByOrigin = depGraph.get(optionsKeyForContext(context));
    const mapByPlatform = mapByOrigin?.get(inputPlatform);

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

    const root = config.server?.unstable_serverRoot ?? config.projectRoot;
    const projectRoot = config.projectRoot;

    type Frame = {
      origin: string;
      request: string;
    };
    type Stack = {
      circular?: boolean;
      limited?: boolean;
      serverRoot?: boolean;
      projectRoot?: boolean;
      frames: Frame[];
    };

    const stackCountLimit = 2_000;
    let stackCounter = 0;
    let inverseStack: Stack | undefined;
    /** @returns boolean - done */
    const saveStack = (stack: Stack): boolean => {
      stackCounter++;

      if (!inverseStack) {
        // First stack, save it
        inverseStack = stack;
        return false;
      }

      if (stackCounter >= stackCountLimit) {
        // Too many stacks explored, stop searching
        return true;
      }

      if (stack.circular || stack.limited) {
        // Not better than the current one, skip
        return false;
      }

      if (inverseStack.circular || inverseStack.limited) {
        // Current one is better than the previous one, save it
        inverseStack = stack;
        // No return as we want to continue validation the new stack
      }

      if (inverseStack.projectRoot) {
        // The best possible stack already acquired, skip
        return true;
      }

      const stackOrigin = stack.frames[stack.frames.length - 1].origin;

      if (
        stackOrigin &&
        stackOrigin.startsWith(projectRoot) &&
        !stackOrigin.includes('node_modules')
      ) {
        // The best stack to show to users is the one leading from the project code.
        stack.serverRoot = true;
        inverseStack = stack;
        return true;
      }

      if (
        // Has to be after the project root check
        stackOrigin &&
        stackOrigin.startsWith(root) &&
        !stackOrigin.includes('node_modules')
      ) {
        // The best stack to show to users is the one leading from the monorepo code.
        stack.serverRoot = true;
        inverseStack = stack;
        return false;
      }

      // If new stack is not better do nothing
      return false;
    };

    /** @returns boolean - done */
    const recurseBackWithLimit = (
      frame: { origin: string; request: string },
      limit: number,
      stack: Stack = { frames: [] },
      visited: Set<string> = new Set()
    ): boolean => {
      stack.frames.push(frame);

      if (visited.has(frame.origin)) {
        stack.circular = true;
        return saveStack(stack);
      }

      if (stack.frames.length >= limit) {
        stack.limited = true;
        return saveStack(stack);
      }

      visited.add(frame.origin);

      const inverse = getReferences(frame.origin);
      if (inverse.length === 0) {
        // No more references, push the stack and return
        return saveStack(stack);
      }

      for (const match of inverse) {
        // Use more qualified name if possible
        // results.origin = match.origin;
        // Found entry point
        if (frame.origin === match.previous) {
          continue;
        }

        const isDone = recurseBackWithLimit(
          { origin: match.previous, request: match.request },
          limit,
          {
            frames: [...stack.frames],
          },
          new Set(visited)
        );

        if (isDone) {
          return true; // Stop search
        }
      }

      return false; // Continue search
    };

    recurseBackWithLimit(
      { origin: context.originModulePath, request: moduleName },
      // TODO: Do we need to expose this?
      35
    );

    debug('Number of explored stacks:', stackCounter);

    if (inverseStack && inverseStack.frames.length > 0) {
      const formattedImport = chalk`{gray  |} {cyan import} `;
      const importMessagePadding = ' '.repeat(stripVTControlCharacters(formattedImport).length);

      debug('Found inverse graph:', JSON.stringify(inverseStack, null, 2));

      let extraMessage = chalk.bold(
        `Import stack${stackCounter >= stackCountLimit ? ` (${stackCounter})` : ''}:`
      );

      for (const frame of inverseStack.frames) {
        let currentMessage = '';
        let filename = path.relative(root, frame.origin);

        if (filename.match(/\?ctx=[\w\d]+$/)) {
          filename = filename.replace(/\?ctx=[\w\d]+$/, chalk.dim(' (require.context)'));
        } else {
          let formattedRequest = chalk.green(`"${frame.request}"`);

          if (
            // If bundling for web and the import is pulling internals from outside of react-native
            // then mark it as an invalid import.
            inputPlatform === 'web' &&
            !/^(node_modules\/)?react-native\//.test(filename) &&
            frame.request.match(/^react-native\/.*/)
          ) {
            formattedRequest =
              formattedRequest +
              chalk`\n${importMessagePadding}{yellow ^ Importing react-native internals is not supported on web.}`;
          }

          filename = filename + chalk`\n${formattedImport}${formattedRequest}`;
        }

        let line = '\n' + chalk.gray(' ') + filename;
        if (filename.match(/node_modules/)) {
          line = chalk.gray(
            // Bold the node module name
            line.replace(/node_modules\/([^/]+)/, (_match, p1) => {
              return 'node_modules/' + chalk.bold(p1);
            })
          );
        }
        currentMessage += `\n${line}`;
        extraMessage += currentMessage;
      }

      if (inverseStack.circular) {
        extraMessage += chalk`\n${importMessagePadding}{yellow ^ The import above creates circular dependency.}`;
      }

      if (inverseStack.limited) {
        extraMessage += chalk`\n {bold {yellow Depth limit reached. The actual stack is longer than what you can see above.}}`;
      }

      extraMessage += '\n';

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
          const inputPlatform = platform ?? 'null';

          const key = optionsKeyForContext(context);
          if (!depGraph.has(key)) depGraph.set(key, new Map());
          const mapByTarget = depGraph.get(key);
          if (!mapByTarget!.has(inputPlatform)) mapByTarget!.set(inputPlatform, new Map());
          const mapByPlatform = mapByTarget!.get(inputPlatform);
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
