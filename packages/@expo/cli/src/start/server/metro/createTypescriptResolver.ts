// This file creates the tsconfig/jsconfig paths resolver.
// It resolves bare module specifiers using `compilerOptions.paths` and `compilerOptions.baseUrl`
// from the project's tsconfig.json or jsconfig.json.
// In development, it watches for config changes and reloads the paths configuration.

import type { ResolutionContext, Resolution } from '@expo/metro/metro-resolver';

import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';
import { FileNotifier } from '../../../utils/FileNotifier';
import { installExitHooks } from '../../../utils/exit';
import type { TsConfigPaths } from '../../../utils/tsconfig/loadTsConfigPaths';
import { loadTsConfigPathsAsync } from '../../../utils/tsconfig/loadTsConfigPaths';
import { resolveWithTsConfigPaths } from '../../../utils/tsconfig/resolveWithTsConfigPaths';

const debug = require('debug')(
  'expo:start:server:metro:typescript-resolver'
) as typeof console.log;

interface TsConfigResolveConfig {
  paths: Record<string, string[]>;
  baseUrl: string;
  hasBaseUrl: boolean;
}

export interface TypescriptResolverInput {
  current: TsConfigResolveConfig | null;
}

const toResolveConfig = (
  tsconfig: TsConfigPaths | null,
  projectRoot: string
): TsConfigResolveConfig | null => {
  if (!tsconfig || (!tsconfig.paths && tsconfig.baseUrl == null)) {
    return null;
  }
  return {
    paths: tsconfig.paths ?? {},
    baseUrl: tsconfig.baseUrl ?? projectRoot,
    hasBaseUrl: !!tsconfig.baseUrl,
  };
};

export async function createTypescriptResolverInput({
  projectRoot,
}: {
  projectRoot: string;
}): Promise<TypescriptResolverInput> {
  const tsconfig = await loadTsConfigPathsAsync(projectRoot);
  return { current: toResolveConfig(tsconfig, projectRoot) };
}

export function watchTypescriptResolverInput(
  input: TypescriptResolverInput,
  { projectRoot }: { projectRoot: string }
): void {
  // TODO: We should track all the files that used imports and invalidate them
  // currently the user will need to save all the files that use imports to
  // use the new aliases.
  // TODO(@kitten): It's unclear why we don't use Metro here, also the above todo is
  // infeasible without switching to Metro and somehow cascading
  const configWatcher = new FileNotifier(projectRoot, ['./tsconfig.json', './jsconfig.json']);
  configWatcher.startObserving(() => {
    debug('Reloading tsconfig.json');
    loadTsConfigPathsAsync(projectRoot).then((tsConfigPaths) => {
      input.current = toResolveConfig(tsConfigPaths, projectRoot);
      if (input.current) {
        debug('Enabling tsconfig.json paths support');
      } else {
        debug('Disabling tsconfig.json paths support');
      }
    });
  });

  // TODO: This probably prevents the process from exiting.
  installExitHooks(() => {
    configWatcher.stopObserving();
  });
}

export function createTypescriptResolver(
  input: TypescriptResolverInput | undefined,
  { getStrictResolver }: { getStrictResolver: StrictResolverFactory }
): ExpoCustomMetroResolver | undefined {
  if (!input) {
    debug('Skipping tsconfig.json paths support');
    return undefined;
  }

  return function requestTsconfigPaths(immutableContext, moduleName, platform) {
    if (!input.current) {
      return null;
    }
    return resolveWithTsConfigPaths(
      input.current,
      { originModulePath: immutableContext.originModulePath, moduleName },
      getOptionalResolve(immutableContext, platform, getStrictResolver)
    );
  };
}

function getOptionalResolve(
  context: ResolutionContext,
  platform: string | null,
  getStrictResolver: StrictResolverFactory
): (moduleName: string) => Resolution | null {
  const doResolve = getStrictResolver(context, platform);
  return function optionalResolve(moduleName: string): Resolution | null {
    try {
      return doResolve(moduleName);
    } catch (error) {
      // If the error is directly related to a resolver not being able to resolve a module, then
      // we can ignore the error and try the next resolver. Otherwise, we should throw the error.
      const isResolutionError =
        isFailedToResolveNameError(error) || isFailedToResolvePathError(error);
      if (!isResolutionError) {
        throw error;
      }
    }
    return null;
  };
}
