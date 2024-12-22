/**
 * A helper script to load the Expo config and loaded plugins from a project
 */

import fs from 'fs/promises';
import module from 'module';
import path from 'path';
import resolveFrom from 'resolve-from';

import { DEFAULT_IGNORE_PATHS, FINGERPRINT_CONFIG_OUTPUT_END_MARKER, FINGERPRINT_CONFIG_OUTPUT_START_MARKER } from '../Options';
import { isIgnoredPath } from '../utils/Path';

async function runAsync(programName: string, args: string[] = []) {
  if (args.length < 1) {
    console.log(`Usage: ${programName} <projectRoot> [ignoredFile]`);
    return;
  }

  const projectRoot = path.resolve(args[0]);
  const ignoredFile = args[1] ? path.resolve(args[1]) : null;

  // @ts-expect-error: module internal _cache
  const loadedModulesBefore = new Set(Object.keys(module._cache));

  const { getConfig } = require(resolveFrom(path.resolve(projectRoot), 'expo/config'));
  const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
  // @ts-expect-error: module internal _cache
  const loadedModules = Object.keys(module._cache)
    .filter((modulePath) => !loadedModulesBefore.has(modulePath))
    .map((modulePath) => path.relative(projectRoot, modulePath));

  const ignoredPaths = await loadIgnoredPathsAsync(ignoredFile);
  const filteredLoadedModules = loadedModules.filter(
    (modulePath) => !isIgnoredPath(modulePath, ignoredPaths)
  );
  // Since we're using stdout to read this output and we cannot always control the entire output
  // (e.g. config.app.js having a console.log), we'll add a start and end marker to the output
  console.log(FINGERPRINT_CONFIG_OUTPUT_START_MARKER);
  console.log(JSON.stringify({ config, loadedModules: filteredLoadedModules }));
  console.log(FINGERPRINT_CONFIG_OUTPUT_END_MARKER);
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
