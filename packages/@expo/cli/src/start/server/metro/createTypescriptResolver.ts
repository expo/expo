// This file creates the tsconfig/jsconfig paths resolver.
// It resolves bare module specifiers using `compilerOptions.paths` and `compilerOptions.baseUrl`
// from the project's tsconfig.json or jsconfig.json.
// In development, it watches for config changes and reloads the paths configuration.

import type { ResolutionContext, Resolution } from '@expo/metro/metro-resolver';
import path from 'path';

import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';
import { FileNotifier } from '../../../utils/FileNotifier';
import { installExitHooks } from '../../../utils/exit';
import type { TsConfigPaths } from '../../../utils/tsconfig/loadTsConfigPaths';
import { loadTsConfigPathsAsync } from '../../../utils/tsconfig/loadTsConfigPaths';

const debug = require('debug')(
  'expo:start:server:metro:typescript-resolver'
) as typeof console.log;

const isAbsolute = process.platform === 'win32' ? path.win32.isAbsolute : path.posix.isAbsolute;

const escapePrefix = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface SuffixEntry {
  suffix: string;
  paths: string[];
}

interface TsConfigResolveConfig {
  baseUrl: string;
  hasBaseUrl: boolean;
  exactMatches: Record<string, string[] | undefined>;
  prefixRe: RegExp | null;
  prefixMap: Record<string, SuffixEntry[]>;
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

  const paths = tsconfig.paths ?? {};
  const exactMatches: Record<string, string[]> = Object.create(null);
  const prefixMap: Record<string, SuffixEntry[]> = Object.create(null);
  const seenPrefixes: string[] = [];

  for (const key in paths) {
    if (!Array.isArray(paths[key])) {
      continue;
    }
    const starIndex = key.indexOf('*');
    if (starIndex === -1) {
      exactMatches[key] = paths[key];
    } else {
      const prefix = key.slice(0, starIndex);
      const suffix = key.slice(starIndex + 1);
      if (!prefixMap[prefix]) {
        prefixMap[prefix] = [];
        seenPrefixes.push(prefix);
      }
      prefixMap[prefix].push({ suffix, paths: paths[key] });
    }
  }

  // Match longest prefix first
  seenPrefixes.sort((a, b) => b.length - a.length);
  const prefixRe = seenPrefixes.length
    ? new RegExp(`^(${seenPrefixes.map(escapePrefix).join('|')})`)
    : null;

  return {
    baseUrl: tsconfig.baseUrl ?? projectRoot,
    hasBaseUrl: !!tsconfig.baseUrl,
    exactMatches,
    prefixRe,
    prefixMap,
  };
};

function resolveWithTsConfigPaths(
  config: TsConfigResolveConfig,
  moduleName: string,
  originModulePath: string,
  resolve: (moduleName: string) => Resolution | null
): Resolution | null {
  if (
    // Library authors cannot utilize this feature in userspace.
    /node_modules/.test(originModulePath) ||
    // Absolute paths are not supported
    isAbsolute(moduleName) ||
    // Relative paths are not supported
    /^\.\.?($|[\\/])/.test(moduleName)
  ) {
    return null;
  }

  const exactPaths = config.exactMatches[moduleName];
  if (exactPaths) {
    for (const alias of exactPaths) {
      if (/\.d\.ts$/.test(alias)) continue;
      const possibleResult = path.join(config.baseUrl, alias);
      const result = resolve(possibleResult);
      if (result) {
        debug(`${moduleName} -> ${possibleResult}`);
        return result;
      }
    }
    // Exact match found in keys but none resolved; don't fall through to wildcards
    return null;
  }

  if (config.prefixRe) {
    const match = config.prefixRe.exec(moduleName);
    if (match) {
      const prefix = match[1]!;
      const rest = moduleName.slice(prefix.length);
      for (const entry of config.prefixMap[prefix]!) {
        if (entry.suffix && !rest.endsWith(entry.suffix)) continue;
        const star = entry.suffix ? rest.slice(0, -entry.suffix.length) : rest;
        for (const alias of entry.paths) {
          const nextModuleName = alias.replace('*', star);
          if (/\.d\.ts$/.test(nextModuleName)) continue;
          const possibleResult = path.join(config.baseUrl, nextModuleName);
          const result = resolve(possibleResult);
          if (result) {
            debug(`${moduleName} -> ${possibleResult}`);
            return result;
          }
        }
        // First matching suffix wins; don't try other suffix entries
        return null;
      }
      // Prefix matched but no suffix matched; don't fall through to baseUrl
      return null;
    }
  }

  // Only resolve against baseUrl if no `paths` groups were matched.
  // Base URL is resolved after paths, and before node_modules.
  if (config.hasBaseUrl) {
    const possibleResult = path.join(config.baseUrl, moduleName);
    const result = resolve(possibleResult);
    if (result) {
      debug(`baseUrl: ${moduleName} -> ${possibleResult}`);
      return result;
    }
  }

  return null;
}

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
      moduleName,
      immutableContext.originModulePath,
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
