/**
 * A helper script to load the Expo config and loaded plugins from a project
 */

import fs from 'fs/promises';
import module from 'module';
import assert from 'node:assert';
import process from 'node:process';
import path from 'path';
import resolveFrom from 'resolve-from';

import { resolveExpoEnvPath } from './ExpoResolver';
import { DEFAULT_IGNORE_PATHS } from './Options';
import { isIgnoredPath } from './utils/Path';

async function runAsync(programName: string, args: string[] = []) {
  if (args.length < 1) {
    console.log(`Usage: ${programName} <projectRoot> [ignoredFile]`);
    return;
  }

  const projectRoot = path.resolve(args[0]);
  const ignoredFile = args[1] ? path.resolve(args[1]) : null;

  // @ts-expect-error: module internal _cache
  const loadedModulesBefore = new Set(Object.keys(module._cache));

  const expoEnvPath = resolveExpoEnvPath(projectRoot);
  assert(expoEnvPath, `Could not find '@expo/env' package for the project from ${projectRoot}.`);
  require(expoEnvPath).load(projectRoot);
  setNodeEnv('development');
  const { getConfig } = require(resolveFrom(path.resolve(projectRoot), 'expo/config'));
  const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
  // @ts-expect-error: module internal _cache
  const loadedModules = Object.keys(module._cache)
    .filter((modulePath) => !loadedModulesBefore.has(modulePath))
    .map((modulePath) => path.relative(projectRoot, modulePath));

  const ignoredPaths = [
    ...DEFAULT_CONFIG_LOADING_IGNORE_PATHS,
    ...(await loadIgnoredPathsAsync(ignoredFile)),
  ];
  const filteredLoadedModules = loadedModules.filter(
    (modulePath) => !isIgnoredPath(modulePath, ignoredPaths)
  );
  const result = JSON.stringify({ config, loadedModules: filteredLoadedModules });
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
    try {
      await runAsync(process.argv[programIndex], process.argv.slice(programIndex + 1));
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
  '**/node_modules/@babel/**/*',
  '**/node_modules/@expo/**/*',
  '**/node_modules/@jridgewell/**/*',
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
    'js-tokens',
    'json5',
    'json-schema-traverse',
    'ms',
    'picocolors',
    'lines-and-columns',
    'require-from-string',
    'resolve-from',
    'schema-utils',
    'signal-exit',
    'sucrase',
    'supports-color',
    'ts-interface-checker',
    'write-file-atomic',
  ].join(',')}}/**/*`,
];
