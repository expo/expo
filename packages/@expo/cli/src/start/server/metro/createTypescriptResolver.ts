// Resolves bare module specifiers using `compilerOptions.paths` and `compilerOptions.baseUrl`
// from the project's tsconfig.json or jsconfig.json.
// Includes a standalone tsconfig parser that walks the `extends` chain using @expo/json-file
// without depending on the `typescript` package. Uses Metro's DependencyGraph for file
// existence, realpath, and node_modules resolution.

import JsonFile from '@expo/json-file';
import type Bundler from '@expo/metro/metro/Bundler';
import type DependencyGraph from '@expo/metro/metro/node-haste/DependencyGraph';
import type FileMap from '@expo/metro/metro-file-map';
import type { FileSystem, ChangeEvent } from '@expo/metro/metro-file-map';
import { RootPathUtils } from '@expo/metro/metro-file-map/lib/RootPathUtils';
import type { ResolutionContext, Resolution } from '@expo/metro/metro-resolver';
import path from 'path';

import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:typescript-resolver') as typeof console.log;

interface ParsedTsConfig {
  baseUrl?: string;
  paths?: Record<string, string[]>;
  pathsBasePath?: string;
  configNormalPaths?: Set<string>;
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
  configNormalPaths: Set<string> | undefined;
}

interface TypescriptResolverInput {
  current: TsConfigResolveConfig | null;
}

export function createTypescriptResolver({
  projectRoot,
  getMetroBundler,
  getStrictResolver,
  watch,
}: {
  projectRoot: string;
  getMetroBundler: () => Bundler;
  getStrictResolver: StrictResolverFactory;
  watch: boolean;
}): ExpoCustomMetroResolver {
  const input: TypescriptResolverInput = { current: null };
  let initialized = false;

  function init() {
    initialized = true;
    const bundler = getMetroBundler();
    const tsconfig = loadTsConfigPaths(projectRoot, bundler._depGraph);
    input.current = toResolveConfig(tsconfig, projectRoot);
    if (watch) {
      setupTsConfigWatcher(input, bundler, projectRoot);
    }
  }

  const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
  const nodeModulesPart = `${path.sep}node_modules${path.sep}`;

  return function requestTsconfigPaths(immutableContext, moduleName, platform) {
    if (!initialized) {
      init();
    }

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

function setupTsConfigWatcher(
  input: TypescriptResolverInput,
  bundler: Bundler,
  projectRoot: string
): void {
  function reload() {
    const tsconfig = loadTsConfigPaths(projectRoot, bundler._depGraph);
    input.current = toResolveConfig(tsconfig, projectRoot);
  }

  const watcher = bundler.getWatcher() as FileMap;
  watcher.addListener('change', ({ changes }: ChangeEvent) => {
    for (const change of changes.addedFiles) {
      if (change[0] === TSCONFIG_NAME || change[0] === JSCONFIG_NAME) {
        return reload();
      }
    }
    if (input.current?.configNormalPaths) {
      for (const change of changes.modifiedFiles) {
        if (input.current.configNormalPaths.has(change[0])) {
          return reload();
        }
      }
      for (const change of changes.removedFiles) {
        if (input.current.configNormalPaths.has(change[0])) {
          return reload();
        }
      }
    }
  });
}

const escapePrefix = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function joinBaseUrl(baseUrl: string, lookup: string): string {
  return path.join(baseUrl, lookup);
}

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

function toResolveConfig(
  tsconfig: ParsedTsConfig | null,
  projectRoot: string
): TsConfigResolveConfig | null {
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
    configNormalPaths: tsconfig.configNormalPaths,
  };
}

const TSCONFIG_NAME = 'tsconfig.json';
const JSCONFIG_NAME = 'jsconfig.json';

function loadTsConfigPaths(projectRoot: string, depGraph: DependencyGraph): ParsedTsConfig | null {
  let configPath: string | null = null;
  if (depGraph.doesFileExist(TSCONFIG_NAME)) {
    configPath = path.join(projectRoot, TSCONFIG_NAME);
  } else if (depGraph.doesFileExist(JSCONFIG_NAME)) {
    configPath = path.join(projectRoot, JSCONFIG_NAME);
  }

  if (!configPath) {
    return null;
  }

  try {
    return loadTsConfigWithExtends(projectRoot, configPath, depGraph);
  } catch (error: any) {
    if (error?.isJsonFileError || error?.name === 'SyntaxError') {
      debug(`Failed to parse ${configPath}: ${error.message}`);
      return null;
    }
    throw error;
  }
}

function loadTsConfigWithExtends(
  projectRoot: string,
  configPath: string,
  depGraph: DependencyGraph
): ParsedTsConfig | null {
  const visited = new Set<string>();
  const rootConfigDir = path.dirname(configPath);

  function load(configPath: string | undefined): ParsedTsConfig | null {
    if (typeof configPath !== 'string' || visited.has(configPath)) {
      return null;
    } else {
      visited.add(configPath);
    }

    const configDir = path.dirname(configPath);
    const raw = JsonFile.read(configPath, { json5: true });
    const own = extractPathsFromCompilerOptions(raw);

    let baseUrl: string | undefined;
    let paths: Record<string, string[]> | undefined;
    let pathsBasePath: string | undefined;
    if (raw.extends) {
      const exts = !Array.isArray(raw.extends) ? [raw.extends] : raw.extends;
      for (const ext of exts) {
        if (typeof ext === 'string') {
          const extPath = resolveExtendsPath(ext, configDir, depGraph._fileSystem);
          const parent = load(extPath);
          if (parent) {
            baseUrl = parent.baseUrl ?? baseUrl;
            paths = parent.paths ?? paths;
            pathsBasePath = parent.pathsBasePath ?? pathsBasePath;
          }
        }
      }
    }

    return {
      baseUrl: own.baseUrl ?? baseUrl,
      paths: own.paths ?? paths,
      pathsBasePath: own.paths != null ? configDir : pathsBasePath,
    };
  }

  const result = load(configPath);
  if (result != null) {
    const pathUtils = new RootPathUtils(projectRoot);
    const configPaths = new Set<string>();
    for (const visitedConfigPath of visited) {
      configPaths.add(pathUtils.absoluteToNormal(visitedConfigPath));
    }
    result.configNormalPaths = configPaths;
    if (result.baseUrl != null) {
      result.baseUrl = path.resolve(
        rootConfigDir,
        substituteConfigDir(result.baseUrl, rootConfigDir)
      );
    }
    if (result.paths != null) {
      for (const key in result.paths) {
        const mapping = result.paths[key]!;
        for (let idx = 0; idx < mapping.length; idx++) {
          mapping[idx] = substituteConfigDir(mapping[idx]!, rootConfigDir);
        }
      }
    }
  }
  return result;
}

function extractPathsFromCompilerOptions(raw: Record<string, unknown>): {
  baseUrl?: string;
  paths?: Record<string, string[]>;
} {
  if (raw.compilerOptions == null || typeof raw.compilerOptions !== 'object') {
    return {};
  }
  const opts = raw.compilerOptions as Record<string, unknown>;
  const baseUrl = typeof opts.baseUrl === 'string' ? opts.baseUrl : undefined;

  let paths: Record<string, string[]> | undefined;
  if (opts.paths != null && typeof opts.paths === 'object') {
    paths = {};
    for (const key in opts.paths as Record<string, unknown>) {
      const values = (opts.paths as Record<string, unknown>)[key];
      if (Array.isArray(values)) {
        paths[key] = values.filter((v): v is string => typeof v === 'string');
      }
    }
  }

  return { baseUrl, paths };
}

function resolveExtendsPath(
  targetPath: string,
  configDir: string,
  fileSystem: FileSystem
): string | undefined {
  let target = fileSystem.lookup(path.join(configDir, targetPath));
  if (target.exists && target.type === 'f') {
    return target.realPath;
  }

  if (!targetPath.endsWith('.json')) {
    target = fileSystem.lookup(path.join(configDir, targetPath + '.json'));
    if (target.exists && target.type === 'f') {
      return target.realPath;
    }
  }

  let lookup: null | undefined | { absolutePath: string; containerRelativePath: string };
  if (!targetPath.endsWith('.json')) {
    lookup = fileSystem.hierarchicalLookup(configDir, `node_modules/${targetPath}.json`, {
      subpathType: 'f',
    });
    if (lookup != null) {
      return lookup.absolutePath;
    }
  }
  if (lookup == null) {
    lookup = fileSystem.hierarchicalLookup(configDir, `node_modules/${targetPath}`, {
      subpathType: 'f',
    });
  }
  if (lookup == null && !targetPath.endsWith('.json')) {
    lookup = fileSystem.hierarchicalLookup(
      configDir,
      `node_modules/${targetPath}/${TSCONFIG_NAME}`,
      {
        subpathType: 'f',
      }
    );
  }

  return lookup?.absolutePath;
}

function substituteConfigDir(value: string, configDir: string): string {
  return value.startsWith('${configDir}')
    ? value.replace('${configDir}', configDir.endsWith(path.sep) ? '.' : './')
    : value;
}
