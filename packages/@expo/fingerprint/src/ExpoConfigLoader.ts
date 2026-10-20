/**
 * A helper script to load the Expo config and loaded plugins from a project
 */

import { consumeConfigEnvMode, loadProjectEnv } from '@expo/env';
import fs from 'fs/promises';
import module from 'module';
import process from 'node:process';
import path from 'path';
import resolveFrom from 'resolve-from';
import { fileURLToPath } from 'url';

import { DEFAULT_IGNORE_PATHS } from './Options';
import {
  buildPathMatchObjects,
  isIgnoredPathWithMatchObjects,
  isProjectLocalPath,
  toPosixPath,
} from './utils/Path';

declare namespace globalThis {
  let __DEV__: boolean | undefined;
}

async function runAsync(programName: string, args: string[] = []) {
  if (args[0] == null) {
    console.log(
      `Usage: ${programName} <projectRoot> [ignoredFile] --mode <development|production> [--skipPlugins]`
    );
    return;
  }

  const projectRoot = path.resolve(args[0]);
  const skipPlugins = args.includes('--skipPlugins');
  const ignoredFileArg = args[1] && !args[1].startsWith('--') ? args[1] : null;
  const ignoredFile = ignoredFileArg ? path.resolve(ignoredFileArg) : null;

  const modeFlagIndex = args.indexOf('--mode');
  const mode = modeFlagIndex >= 0 ? args[modeFlagIndex + 1] : undefined;
  if (mode !== 'development' && mode !== 'production') {
    throw new Error(`Unsupported Expo config mode: ${mode}`);
  }
  consumeConfigEnvMode();
  globalThis.__DEV__ = mode === 'development';
  loadProjectEnv(projectRoot, { mode });

  const { getCapturedModules, uninstall } = installModuleCaptureHook();
  const importGraph = skipPlugins ? null : installImportGraphHook();
  let config;
  try {
    const { getConfig } = require(resolveFrom(path.resolve(projectRoot), 'expo/config'));
    config = await getConfig(projectRoot, {
      skipSDKVersionRequirement: true,
      skipPlugins,
    });
  } finally {
    uninstall();
    importGraph?.uninstall();
  }

  const ignoredPaths = [
    ...DEFAULT_CONFIG_LOADING_IGNORE_PATHS,
    ...(await loadIgnoredPathsAsync(ignoredFile)),
  ];
  const capturedModules = getCapturedModules();
  const loadedModules = await resolveLoadedModuleSourcesAsync(
    capturedModules,
    projectRoot,
    ignoredPaths
  );

  const result = JSON.stringify({
    // The plugins-skipped pass only contributes its module list to the diff; its config is unused.
    config: skipPlugins ? null : config,
    loadedModules,
    projectModules: importGraph
      ? collectProjectModulePaths(capturedModules, importGraph.getImports(), projectRoot)
      : null,
  });

  if (process.send) {
    process.send(result);
  } else {
    console.log(result);
  }
}

// If running from the command line
if (require.main?.filename === __filename) {
  (async () => {
    const programIndex = process.argv.findIndex((arg) => arg === __filename);
    const programName = process.argv[programIndex] ?? __filename;
    try {
      await runAsync(programName, process.argv.slice(programIndex + 1));
    } catch (e) {
      console.error('Uncaught Error', e);
      process.exit(1);
    }
  })();
}

/**
 * Load the generated ignored paths file from caller and remove the file after loading
 */
async function loadIgnoredPathsAsync(ignoredFile: string | null) {
  if (!ignoredFile) {
    return DEFAULT_IGNORE_PATHS;
  }

  const ignorePaths = [];
  try {
    const fingerprintIgnore = await fs.readFile(ignoredFile, 'utf8');
    const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
    for (const line of fingerprintIgnoreLines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        ignorePaths.push(trimmedLine);
      }
    }
  } catch {}

  return ignorePaths;
}

/**
 * A CommonJS module observed while `installModuleCaptureHook()` was active.
 */
export interface CapturedModule {
  /** The module id (cache key). May diverge from `filename` for virtual modules. */
  id: string;
  /** The filename Node compiled the module under. Authoritative even for transpiled sources. */
  filename: string;
  /** The source content Node executed for the module. */
  content: string;
}

/**
 * A config-plugin source produced from a captured module.
 * A module backed by a real file becomes a `file` source.
 * For virtual modules without a physical file in the file system, it becomes a `contents` source
 * carrying the captured body.
 */
export type LoadedModuleSource =
  | { type: 'file'; path: string }
  | { type: 'contents'; id: string; contents: string };

/**
 * Observe every CommonJS module compiled while the hook is installed.
 * We hook `Module.prototype._compile` to keep each module's authoritative filename and source
 * content. Every argument is forwarded: Node 22.18+ passes a `format` argument that tells it to
 * strip types from a `.ts` file.
 */
export function installModuleCaptureHook(): {
  getCapturedModules: () => CapturedModule[];
  uninstall: () => void;
} {
  const moduleProto = (module as unknown as { prototype: ModuleCompilePrototype }).prototype;
  const capturedModules: CapturedModule[] = [];
  const originalCompile = moduleProto._compile;
  moduleProto._compile = function (
    this: { id?: string },
    content: string,
    filename: string,
    ...rest: unknown[]
  ) {
    capturedModules.push({ id: this.id ?? filename, filename, content });
    return originalCompile.call(this, content, filename, ...rest);
  };
  return {
    getCapturedModules: () => capturedModules,
    uninstall: () => {
      moduleProto._compile = originalCompile;
    },
  };
}

interface ModuleCompilePrototype {
  _compile: (
    this: { id?: string },
    content: string,
    filename: string,
    ...rest: unknown[]
  ) => unknown;
}

/**
 * Turn captured modules into config-plugin sources, dropping ignored paths.
 * A real file becomes a `file` source; a module with no file on disk (virtual / compiled from a
 * string) becomes a `contents` source keyed by its project-relative path so it stays stable across
 * runs. A path that exists but is not a file (e.g. a directory) is skipped.
 */
export async function resolveLoadedModuleSourcesAsync(
  capturedModules: CapturedModule[],
  projectRoot: string,
  ignoredPaths: string[]
): Promise<LoadedModuleSource[]> {
  const seen = new Set<string>();
  const ignoredPathMatchObjects = buildPathMatchObjects(ignoredPaths);
  const candidates = capturedModules
    .map(({ filename, content }) => ({
      relativePath: toProjectRelativePath(projectRoot, filename),
      filename,
      content,
    }))
    .filter(({ relativePath }) => {
      if (
        seen.has(relativePath) ||
        isIgnoredPathWithMatchObjects(relativePath, ignoredPathMatchObjects)
      ) {
        return false;
      }
      seen.add(relativePath);
      return true;
    });

  const sources = await Promise.all(
    candidates.map(
      async ({ relativePath, filename, content }): Promise<LoadedModuleSource | null> => {
        try {
          const stat = await fs.stat(filename);
          return stat.isFile() ? { type: 'file', path: relativePath } : null;
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            return { type: 'contents', id: relativePath, contents: content };
          }
          throw error;
        }
      }
    )
  );

  return sources.filter((source): source is LoadedModuleSource => source !== null);
}

/**
 * The import that first resolved a file while `installImportGraphHook()` was active.
 */
export interface ResolvedImport {
  /** The filename of the module that imported. */
  parent: string;
  /** The filename the import resolved to. */
  child: string;
}

/**
 * Record which file loads which while the config is evaluated, through a `module.registerHooks`
 * resolve hook (Node 22.15+) that runs for `require`, `import` and `require(esm)` alike.
 * Without `module.registerHooks` no import is recorded.
 */
export function installImportGraphHook(): {
  getImports: () => ResolvedImport[];
  uninstall: () => void;
} {
  const imports: ResolvedImport[] = [];
  const resolveHooks =
    typeof module.registerHooks === 'function'
      ? module.registerHooks({ resolve: createImportGraphResolveHook(imports) })
      : null;
  return {
    getImports: () => imports,
    uninstall: () => {
      resolveHooks?.deregister();
    },
  };
}

/**
 * A `module.registerHooks` resolve hook that records, for each file, the first import that resolves
 * it, or the first call that only resolves it, such as `import.meta.resolve`. So a module the
 * config-loading framework resolves before the project's own code runs stays the framework's when
 * project code imports it later.
 */
export function createImportGraphResolveHook(imports: ResolvedImport[]): module.ResolveHookSync {
  const resolvedUrls = new Set<string>();
  return (specifier, context, nextResolve) => {
    const result = nextResolve(specifier, context);
    if (result.url.startsWith('file:') && !resolvedUrls.has(result.url)) {
      resolvedUrls.add(result.url);
      if (context.parentURL?.startsWith('file:')) {
        imports.push({
          parent: fileURLToPath(context.parentURL),
          child: fileURLToPath(result.url),
        });
      }
    }
    return result;
  };
}

/**
 * The project-relative paths of the captured modules that the project's own code loads.
 * A module inside the project root belongs to the project, and so does every module it loads,
 * directly or through another such module, unless the module is in `node_modules`.
 * A config plugin a monorepo workspace package exports sits outside the project root and is
 * reached this way. The modules the config-loading framework resolves before the project's own code
 * runs are not, even when the framework is itself a linked workspace package.
 */
export function collectProjectModulePaths(
  capturedModules: CapturedModule[],
  imports: ResolvedImport[],
  projectRoot: string
): string[] {
  const toRelativePath = (filename: string) => toProjectRelativePath(projectRoot, filename);
  const importsByParent = new Map<string, string[]>();
  for (const { parent, child } of imports) {
    const children = importsByParent.get(parent);
    if (children) {
      children.push(child);
    } else {
      importsByParent.set(parent, [child]);
    }
  }
  const capturedFilenames = new Set(capturedModules.map(({ filename }) => filename));
  const pending = [...capturedFilenames].filter((filename) =>
    isProjectLocalPath(toRelativePath(filename))
  );
  const reached = new Set(pending);
  for (let parent = pending.pop(); parent !== undefined; parent = pending.pop()) {
    for (const child of importsByParent.get(parent) ?? []) {
      if (!reached.has(child) && !isNodeModulesPath(toRelativePath(child))) {
        reached.add(child);
        pending.push(child);
      }
    }
  }
  return [...reached]
    .filter((filename) => capturedFilenames.has(filename))
    .map(toRelativePath)
    .sort();
}

/**
 * The project-relative POSIX path of a captured module: the key of its loaded module source.
 */
function toProjectRelativePath(projectRoot: string, filename: string): string {
  return toPosixPath(path.relative(projectRoot, filename));
}

/**
 * Get the path to the ExpoConfigLoader file.
 */
export function getExpoConfigLoaderPath() {
  return path.join(__dirname, 'ExpoConfigLoader.js');
}

// Ignore known non-native packages loaded while applying config plugins, which the plugins-skipped
// diff can't drop since they only load during plugin application.
const DEFAULT_CONFIG_LOADING_IGNORE_PATHS = [
  '**/node_modules/@expo/**/*',
  `**/node_modules/{${[
    'ansi-styles',
    'base64-js',
    'big-integer',
    'bplist-creator',
    'chalk',
    'cross-spawn',
    'debug',
    'has-flag',
    'isexe',
    'jimp-compact',
    'ms',
    'parse-png',
    'path-key',
    'plist',
    'pngjs',
    'sax',
    'semver',
    'shebang-command',
    'shebang-regex',
    'simple-plist',
    'stream-buffers',
    'supports-color',
    'uuid',
    'which',
    'xcode',
    'xml2js',
    'xmlbuilder',
  ].join(',')}}/**/*`,
];
