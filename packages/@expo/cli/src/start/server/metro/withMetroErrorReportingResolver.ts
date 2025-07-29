import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import type { ResolutionContext } from '@expo/metro/metro-resolver';
import chalk from 'chalk';
import path from 'path';
import { stripVTControlCharacters } from 'util';

import type { ExpoCustomMetroResolver } from './withMetroResolvers';
import { isPathInside } from '../../../utils/dir';
import { env } from '../../../utils/env';

const debug = require('debug')('expo:metro:withMetroResolvers') as typeof console.log;

// TODO: Do we need to expose this?
const STACK_DEPTH_LIMIT = 35;
const STACK_COUNT_LIMIT = 2_000;

export function withMetroErrorReportingResolver(config: MetroConfig): MetroConfig {
  if (!env.EXPO_METRO_UNSTABLE_ERRORS) {
    return config;
  }

  const originalResolveRequest = config.resolver?.resolveRequest;

  const depGraph: DepGraph = new Map();

  const mutateResolutionError = createMutateResolutionError(config, depGraph);

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

export type DepGraph = Map<
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
>;

function optionsKeyForContext(context: ResolutionContext) {
  const canonicalize: typeof import('@expo/metro/metro-core/canonicalize').default = require('@expo/metro/metro-core/canonicalize');
  // Compound key for the resolver cache
  return JSON.stringify(context.customResolverOptions ?? {}, canonicalize) ?? '';
}

export const createMutateResolutionError =
  (
    config: MetroConfig,
    depGraph: DepGraph,
    stackDepthLimit = STACK_DEPTH_LIMIT,
    stackCountLimit = STACK_COUNT_LIMIT
  ) =>
  (error: Error, context: ResolutionContext, moduleName: string, platform: string | null) => {
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
        isPathInside(stackOrigin, projectRoot) &&
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
        isPathInside(stackOrigin, root) &&
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
      stackDepthLimit
    );

    debug('Number of explored stacks:', stackCounter);

    if (inverseStack && inverseStack.frames.length > 0) {
      const formattedImport = chalk`{gray  |} {cyan import} `;
      const importMessagePadding = ' '.repeat(stripVTControlCharacters(formattedImport).length + 1);

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
        extraMessage += chalk`\n\n {bold {yellow Depth limit reached. The actual stack is longer than what you can see above.}}`;
      }

      extraMessage += '\n';

      // @ts-expect-error
      error._expoImportStack = extraMessage;
    } else {
      debug('Found no inverse tree for:', context.originModulePath);
    }

    return error;
  };
