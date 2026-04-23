import type { ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import type { MiddlewareMatcher } from 'expo-server';
import { sync as globSync } from 'glob';
import path from 'path';

import { Log } from '../../../log';
import { directoryExistsSync } from '../../../utils/dir';
import { toPosixPath } from '../../../utils/filePath';
import { learnMore } from '../../../utils/link';

const debug = require('debug')('expo:start:server:metro:router') as typeof console.log;

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

  return files[0]!;
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

export function warnInvalidMiddlewareMatcherSettings(matcher: MiddlewareMatcher) {
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  // Ensure methods are valid HTTP methods
  if (matcher.methods) {
    if (!Array.isArray(matcher.methods)) {
      Log.error(
        chalk.red`Middleware matcher methods must be an array of valid HTTP methods. Supported methods are: ${validMethods.join(', ')}`
      );
    } else {
      for (const method of matcher.methods) {
        if (!validMethods.includes(method)) {
          Log.error(
            chalk.red`Invalid middleware HTTP method: ${method}. Supported methods are: ${validMethods.join(', ')}`
          );
        }
      }
    }
  }

  // Ensure patterns are either a string or RegExp
  if (matcher.patterns) {
    const patterns = Array.isArray(matcher.patterns) ? matcher.patterns : [matcher.patterns];
    for (const pattern of patterns) {
      if (typeof pattern !== 'string' && !(pattern instanceof RegExp)) {
        Log.error(
          chalk.red`Middleware matcher patterns must be strings or regular expressions. Received: ${String(
            pattern
          )}`
        );
      }

      if (typeof pattern === 'string' && !pattern.startsWith('/')) {
        Log.error(
          chalk.red`String patterns in middleware matcher must start with '/'. Received: ${pattern}`
        );
      }
    }
  }
}
