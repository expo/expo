/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import * as fs from 'fs';
import { boolish } from 'getenv';
import * as path from 'path';

type LoadOptions = {
  silent?: boolean;
  force?: boolean;
};

const debug = require('debug')('expo:env') as typeof console.log;

export function isEnabled(): boolean {
  return !boolish('EXPO_NO_DOTENV', false);
}

export function createControlledEnvironment() {
  const IS_DEBUG = require('debug').enabled('expo:env');

  let userDefinedEnvironment: NodeJS.ProcessEnv | undefined = undefined;
  let memo: { env: NodeJS.ProcessEnv; files: string[] } | undefined = undefined;

  function _getForce(
    projectRoot: string,
    options: LoadOptions = {}
  ): { env: Record<string, string | undefined>; files: string[] } {
    if (!isEnabled()) {
      debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
      return { env: {}, files: [] };
    }

    if (!userDefinedEnvironment) {
      userDefinedEnvironment = { ...process.env };
    }

    // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
    const dotenvFiles = getFiles(process.env.NODE_ENV, options);

    const loadedEnvFiles: string[] = [];
    const parsed: dotenv.DotenvParseOutput = {};

    // Load environment variables from .env* files. Suppress warnings using silent
    // if this file is missing. dotenv will never modify any environment variables
    // that have already been set. Variable expansion is supported in .env files.
    // https://github.com/motdotla/dotenv
    // https://github.com/motdotla/dotenv-expand
    dotenvFiles.forEach((dotenvFile) => {
      const absoluteDotenvFile = path.resolve(projectRoot, dotenvFile);
      if (!fs.existsSync(absoluteDotenvFile)) {
        return;
      }
      try {
        const results = expand(
          dotenv.config({
            debug: IS_DEBUG,
            path: absoluteDotenvFile,
            // We will handle overriding ourselves to allow for HMR.
            override: true,
          })
        );
        if (results.parsed) {
          loadedEnvFiles.push(absoluteDotenvFile);
          debug(`Loaded environment variables from: ${absoluteDotenvFile}`);

          for (const key of Object.keys(results.parsed || {})) {
            if (
              typeof parsed[key] === 'undefined' &&
              // Custom override logic to prevent overriding variables that
              // were set before the CLI process began.
              typeof userDefinedEnvironment?.[key] === 'undefined'
            ) {
              parsed[key] = results.parsed[key];
            }
          }
        } else {
          debug(`Failed to load environment variables from: ${absoluteDotenvFile}`);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(
            `Failed to load environment variables from ${absoluteDotenvFile}: ${error.message}`
          );
        } else {
          throw error;
        }
      }
    });

    if (!loadedEnvFiles.length) {
      debug(`No environment variables loaded from .env files.`);
    }

    return { env: parsed, files: loadedEnvFiles };
  }

  /** Get the environment variables without mutating the environment. This returns memoized values unless the `force` property is provided. */
  function get(
    projectRoot: string,
    options: LoadOptions = {}
  ): { env: Record<string, string | undefined>; files: string[] } {
    if (!isEnabled()) {
      debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
      return { env: {}, files: [] };
    }
    if (!options.force && memo) {
      return memo;
    }
    memo = _getForce(projectRoot, options);
    return memo;
  }

  /** Load environment variables from .env files and mutate the current `process.env` with the results. */
  function load(projectRoot: string, options: LoadOptions = {}) {
    if (!isEnabled()) {
      debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
      return process.env;
    }

    const envInfo = get(projectRoot, options);

    if (!options.force) {
      const keys = Object.keys(envInfo.env);
      if (keys.length) {
        console.log(
          chalk.gray('env: load', envInfo.files.map((file) => path.basename(file)).join(' '))
        );
        console.log(chalk.gray('env: export', keys.join(' ')));
      }
    }

    process.env = { ...process.env, ...envInfo.env };
    return process.env;
  }

  return {
    load,
    get,
    _getForce,
  };
}

export function getFiles(
  mode: string | undefined,
  { silent = false }: Pick<LoadOptions, 'silent'> = {}
): string[] {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return [];
  }

  if (!mode) {
    if (silent) {
      debug('NODE_ENV is not defined, proceeding without mode-specific .env');
    } else {
      console.error(
        chalk.red(
          'The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set.'
        )
      );
      console.error(chalk.red('Proceeding without mode-specific .env'));
    }
  }

  if (mode && !['development', 'test', 'production'].includes(mode)) {
    throw new Error(
      `Environment variable "NODE_ENV=${mode}" is invalid. Valid values are "development", "test", and "production`
    );
  }

  if (!mode) {
    // Support environments that don't respect NODE_ENV
    return [`.env.local`, '.env'];
  }
  // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
  const dotenvFiles = [
    `.env.${mode}.local`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    mode !== 'test' && `.env.local`,
    `.env.${mode}`,
    '.env',
  ].filter(Boolean) as string[];

  return dotenvFiles;
}
