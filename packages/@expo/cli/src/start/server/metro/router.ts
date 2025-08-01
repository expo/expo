import { ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import { sync as globSync } from 'glob';
import path from 'path';
import resolveFrom from 'resolve-from';

import { Log } from '../../../log';
import { directoryExistsSync } from '../../../utils/dir';
import { toPosixPath } from '../../../utils/filePath';
import { learnMore } from '../../../utils/link';

const debug = require('debug')('expo:start:server:metro:router') as typeof console.log;

/**
 * Get the relative path for requiring the `/app` folder relative to the `expo-router/entry` file.
 * This mechanism does require the server to restart after the `expo-router` package is installed.
 */
export function getAppRouterRelativeEntryPath(
  projectRoot: string,
  routerDirectory: string = getRouterDirectory(projectRoot)
): string | undefined {
  // Auto pick App entry
  const routerEntry =
    resolveFrom.silent(projectRoot, 'expo-router/entry') ?? getFallbackEntryRoot(projectRoot);
  if (!routerEntry) {
    return undefined;
  }
  // It doesn't matter if the app folder exists.
  const appFolder = path.join(projectRoot, routerDirectory);
  const appRoot = path.relative(path.dirname(routerEntry), appFolder);
  debug('expo-router entry', routerEntry, appFolder, appRoot);
  return appRoot;
}

/** If the `expo-router` package is not installed, then use the `expo` package to determine where the node modules are relative to the project. */
function getFallbackEntryRoot(projectRoot: string): string {
  const expoRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (expoRoot) {
    return path.join(path.dirname(path.dirname(expoRoot)), 'expo-router/entry');
  }
  return path.join(projectRoot, 'node_modules/expo-router/entry');
}

export function getRouterDirectoryModuleIdWithManifest(
  projectRoot: string,
  exp: ExpoConfig
): string {
  return toPosixPath(exp.extra?.router?.root ?? getRouterDirectory(projectRoot));
}

let hasWarnedAboutSrcDir = false;
const logSrcDir = () => {
  if (hasWarnedAboutSrcDir) return;
  hasWarnedAboutSrcDir = true;
  Log.log(chalk.gray('Using src/app as the root directory for Expo Router.'));
};

export function getRouterDirectory(projectRoot: string): string {
  // more specific directories first
  if (directoryExistsSync(path.join(projectRoot, 'src', 'app'))) {
    logSrcDir();
    return path.join('src', 'app');
  }

  debug('Using app as the root directory for Expo Router.');
  return 'app';
}

export function isApiRouteConvention(name: string): boolean {
  return /\+api\.[tj]sx?$/.test(name);
}

export function getApiRoutesForDirectory(cwd: string) {
  return globSync('**/*+api.@(ts|tsx|js|jsx)', {
    cwd,
    absolute: true,
    dot: true,
  });
}

/**
 * Gets the +middleware file for a given directory. In
 * @param cwd
 */
export function getMiddlewareForDirectory(cwd: string): string | null {
  const files = globSync('+middleware.@(ts|tsx|js|jsx)', {
    cwd,
    absolute: true,
    dot: true,
  });

  if (files.length === 0) return null;

  if (files.length > 1) {
    // In development, throw an error if there are multiple root-level middleware files
    if (process.env.NODE_ENV !== 'production') {
      const relativePaths = files.map((f) => './' + path.relative(cwd, f)).sort();
      throw new Error(
        `Only one middleware file is allowed. Keep one of the conflicting files: ${relativePaths.map((p) => `"${p}"`).join(' or ')}`
      );
    }
  }

  return files[0];
}

// Used to emulate a context module, but way faster. TODO: May need to adjust the extensions to stay in sync with Metro.
export function getRoutePaths(cwd: string) {
  return globSync('**/*.@(ts|tsx|js|jsx)', {
    cwd,
    dot: true,
  }).map((p) => './' + normalizePaths(p));
}

function normalizePaths(p: string) {
  return p.replace(/\\/g, '/');
}

let hasWarnedAboutApiRouteOutput = false;
let hasWarnedAboutMiddlewareOutput = false;

export function hasWarnedAboutApiRoutes() {
  return hasWarnedAboutApiRouteOutput;
}

export function hasWarnedAboutMiddleware() {
  return hasWarnedAboutMiddlewareOutput;
}

export function warnInvalidWebOutput() {
  if (!hasWarnedAboutApiRouteOutput) {
    Log.warn(
      chalk.yellow`Using API routes requires the {bold web.output} to be set to {bold "server"} in the project {bold app.json}. ${learnMore(
        'https://docs.expo.dev/router/reference/api-routes/'
      )}`
    );
  }

  hasWarnedAboutApiRouteOutput = true;
}

export function warnInvalidMiddlewareOutput() {
  if (!hasWarnedAboutMiddlewareOutput) {
    Log.warn(
      chalk.yellow`Using middleware requires the {bold web.output} to be set to {bold "server"} in the project {bold app.json}. ${learnMore(
        'https://docs.expo.dev/router/reference/api-routes/'
      )}`
    );
  }

  hasWarnedAboutMiddlewareOutput = true;
}
