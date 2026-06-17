/**
 * A helper script to load the Expo config and loaded plugins from a project
 */

import fs from 'fs/promises';
import module from 'module';
import process from 'node:process';
import path from 'path';
import resolveFrom from 'resolve-from';

import { DEFAULT_IGNORE_PATHS } from './Options';
import { isIgnoredPath, toPosixPath } from './utils/Path';

async function runAsync(programName: string, args: string[] = []) {
  if (args[0] == null) {
    console.log(`Usage: ${programName} <projectRoot> [ignoredFile]`);
    return;
  }

  const projectRoot = path.resolve(args[0]);
  const ignoredFile = args[1] ? path.resolve(args[1]) : null;

  setNodeEnv('development');
  require('@expo/env').load(projectRoot);

  const loadedModulesBefore = new Set(Object.keys(module._cache));

  const { getConfig } = require(resolveFrom(path.resolve(projectRoot), 'expo/config'));
  const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const virtualModuleNames = new Set<string>();
  const loadedModules: string[] = [];

  // TODO(@kitten): Don't rely on `module._cache` for this over Node loader hooks
  // The module cache isn't reflective of real files necessarily
  for (const id of Object.keys(module._cache)) {
    if (loadedModulesBefore.has(id)) {
      continue;
    }

    let filename = id;

    const mod = module._cache[id] as any;
    if (mod != null && mod.filename != null) {
      filename = mod.filename || id;
    }

    // NOTE(@kitten): Virtual modules may be placed on `module._cache` and we can't rely on the ID to be accurate
    // The IDs are also not necessarily paths. We prefer `filename`, and trust they exist, but if the ID mismatches
    // with the module name, we use the ID, and ignore the filename entirely
    if (filename !== id) {
      virtualModuleNames.add(filename);
      loadedModules.push(id);
    } else {
      loadedModules.push(filename);
    }
  }

  const ignoredPaths = [
    ...DEFAULT_CONFIG_LOADING_IGNORE_PATHS,
    ...(await loadIgnoredPathsAsync(ignoredFile)),
  ];

  const filteredLoadedModules = loadedModules.filter(
    (modulePath) => !virtualModuleNames.has(modulePath)
  );

  const existingLoadedModules = (
    await Promise.all(
      filteredLoadedModules.map(async (modulePath) => {
        const relativePath = toPosixPath(path.relative(projectRoot, modulePath));
        if (isIgnoredPath(relativePath, ignoredPaths)) {
          return null;
        }

        try {
          const stat = await fs.stat(modulePath);
          if (!stat.isFile()) {
            return null;
          }

          return relativePath;
        } catch (error: any) {
          // Filter out virtual paths / non-existent files
          if (error.code === 'ENOENT') {
            return null;
          }
          throw error;
        }
      })
    )
  ).filter((modulePath) => modulePath != null);

  const result = JSON.stringify({ config, loadedModules: existingLoadedModules });

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
 * Get the path to the ExpoConfigLoader file.
 */
export function getExpoConfigLoaderPath() {
  return path.join(__dirname, 'ExpoConfigLoader.js');
}

/**
 * Set the environment to production or development
 * Replicates the code from `@expo/cli` to ensure the same environment is set.
 */
function setNodeEnv(mode: 'development' | 'production') {
  process.env.NODE_ENV = process.env.NODE_ENV || mode;
  process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;

  // @ts-expect-error: Add support for external React libraries being loaded in the same process.
  globalThis.__DEV__ = process.env.NODE_ENV !== 'production';
}

// Ignore default javascript files when calling `getConfig()`
const DEFAULT_CONFIG_LOADING_IGNORE_PATHS = [
  // We don't want to include the whole project package.json from the ExpoConfigLoader phase.
  'package.json',

  '**/node_modules/@babel/**/*',
  '**/node_modules/@expo/**/*',
  '**/node_modules/@jridgewell/**/*',
  '**/node_modules/cross-spawn/**/*',
  '**/node_modules/isexe/**/*',
  '**/node_modules/shebang-command/**/*',
  '**/node_modules/shebang-regex/**/*',
  '**/node_modules/semver/**/*',
  '**/node_modules/slugify/**/*',
  '**/node_modules/typescript/**/*',
  '**/node_modules/expo/config/**/*',
  '**/node_modules/expo/config.js',
  '**/node_modules/expo/config-plugins.js',
  `**/node_modules/{${[
    'ajv',
    'ajv-formats',
    'ajv-keywords',
    'ansi-styles',
    'chalk',
    'debug',
    'dotenv',
    'dotenv-expand',
    'escape-string-regexp',
    'getenv',
    'graceful-fs',
    'fast-deep-equal',
    'fast-uri',
    'has-flag',
    'imurmurhash',
    'jimp-compact',
    'js-tokens',
    'json5',
    'json-schema-traverse',
    'ms',
    'parse-png',
    'path-key',
    'picocolors',
    'pngjs',
    'lines-and-columns',
    'require-from-string',
    'resolve-from',
    'sax',
    'schema-utils',
    'signal-exit',
    'sucrase',
    'supports-color',
    'ts-interface-checker',
    'write-file-atomic',
    'xml2js',
    'xmlbuilder',
    'which',
  ].join(',')}}/**/*`,
];
