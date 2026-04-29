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

const debug = require('debug')('expo:start:server:metro:typescript-resolver') as typeof console.log;

const escapePrefix = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function joinBaseUrl(baseUrl: string, lookup: string): string {
  // Joins baseUrl with a tsconfig alias or module name. Wildcard characters ('*')
  // pass through unchanged, and './' / '../' segments are normalized.
  return path.join(baseUrl, lookup);
}

interface SuffixEntry {
  suffix: string;
  mapping: string[];
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

  const baseUrl = tsconfig.baseUrl ?? projectRoot;
  const paths = tsconfig.paths ?? {};
  const exactMatches: Record<string, string[]> = Object.create(null);
  const prefixMap: Record<string, SuffixEntry[]> = Object.create(null);
  const seenPrefixes: string[] = [];

  for (const key in paths) {
    if (!Array.isArray(paths[key])) {
      continue;
    }
    // Pre-join with baseUrl so the hot path avoids path.join entirely
    const mapping = paths[key]
      .filter((p) => typeof p === 'string' && !p.endsWith('.d.ts'))
      .map((p) => joinBaseUrl(baseUrl, p));
    if (mapping.length > 0) {
      const starIndex = key.indexOf('*');
      if (starIndex === -1) {
        exactMatches[key] = mapping;
      } else {
        const prefix = key.slice(0, starIndex);
        const suffix = key.slice(starIndex + 1);
        if (!prefixMap[prefix]) {
          prefixMap[prefix] = [];
          seenPrefixes.push(prefix);
        }
        prefixMap[prefix].push({ suffix, mapping });
      }
    }
  }

  // Match longest prefix first
  seenPrefixes.sort((a, b) => b.length - a.length);
  const prefixRe = seenPrefixes.length
    ? new RegExp(`^(${seenPrefixes.map(escapePrefix).join('|')})`)
    : null;

  return {
    baseUrl,
    hasBaseUrl: !!tsconfig.baseUrl,
    exactMatches,
    prefixRe,
    prefixMap,
  };
};

function resolveWithTsConfigPaths(
  config: TsConfigResolveConfig,
  moduleName: string,
  resolve: (moduleName: string) => Resolution | null
): Resolution | null {
  const exactPaths = config.exactMatches[moduleName];
  if (exactPaths != null) {
    for (const alias of exactPaths) {
      const result = resolve(alias);
      if (result != null) {
        debug(`${moduleName} -> ${alias}`);
        return result;
      }
    }
    // Exact match found in keys but none resolved; don't fall through to wildcards
    return null;
  }

  if (config.prefixRe != null) {
    const match = config.prefixRe.exec(moduleName);
    if (match != null) {
      const prefix = match[1]!;
      const rest = moduleName.slice(prefix.length);
      for (const entry of config.prefixMap[prefix]!) {
        let star = rest;
        if (entry.suffix) {
          if (!rest.endsWith(entry.suffix)) continue;
          star = rest.slice(0, -entry.suffix.length);
        }
        for (const alias of entry.mapping) {
          const possibleResult = alias.replace('*', star);
          const result = resolve(possibleResult);
          if (result != null) {
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
    const possibleResult = joinBaseUrl(config.baseUrl, moduleName);
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

  const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
  const nodeModulesPart = `${path.sep}node_modules${path.sep}`;

  return function requestTsconfigPaths(immutableContext, moduleName, platform) {
    if (!input.current) {
      return null;
    } else if (fileSpecifierRe.test(moduleName)) {
      return null;
    } else if (immutableContext.originModulePath.includes(nodeModulesPart)) {
      return null;
    }

    return resolveWithTsConfigPaths(
      input.current,
      moduleName,
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
