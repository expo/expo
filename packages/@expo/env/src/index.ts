import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import { boolish } from 'getenv';
import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';

const debug = require('debug')('expo:env') as typeof console.log;

/** Determine if the `.env` files are enabled or not, through `EXPO_NO_DOTENV` */
export function isEnabled() {
  return !boolish('EXPO_NO_DOTENV', false);
}

/** All conventional modes that should not cause warnings */
export const KNOWN_MODES = ['development', 'test', 'production'];

/** The environment variable name to use when marking the environment as loaded */
export const LOADED_ENV_NAME = '__EXPO_ENV_LOADED';

/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
export function getEnvFiles({
  mode = process.env.NODE_ENV,
  silent,
}: {
  /** The mode to use when creating the list of `.env*` files, defaults to `NODE_ENV` */
  mode?: string;
  /** If possible misconfiguration warnings should be logged, or only logged as debug log */
  silent?: boolean;
} = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return [];
  }

  const logError = silent ? debug : console.error;
  const logWarning = silent ? debug : console.warn;

  if (!mode) {
    logError(
      `The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set. Using only .env.local and .env`
    );
    return ['.env.local', '.env'];
  }

  if (!KNOWN_MODES.includes(mode)) {
    logWarning(
      `NODE_ENV="${mode}" is non-conventional and might cause development code to run in production. Use "development", "test", or "production" instead. Continuing with non-conventional mode`
    );
  }

  // see: https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
  return [
    `.env.${mode}.local`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    mode !== 'test' && `.env.local`,
    `.env.${mode}`,
    `.env`,
  ].filter(Boolean) as string[];
}

/**
 * Parse all environment variables using the list of `.env*` files, in order of higest priority to lowest priority.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
export function parseEnvFiles(
  envFiles: string[],
  {
    systemEnv = process.env,
  }: {
    /** The system environment to use when expanding environment variables, defaults to `process.env` */
    systemEnv?: NodeJS.ProcessEnv;
  } = {}
) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return { env: {}, files: [] };
  }

  // Load environment variables from .env* files. Suppress warnings using silent
  // if this file is missing. Dotenv will only parse the environment variables,
  // `@expo/env` will set the resulting variables to the current process.
  // Variable expansion is supported in .env files, and executed as final step.
  // https://github.com/motdotla/dotenv
  // https://github.com/motdotla/dotenv-expand
  const loadedEnvVars: dotenv.DotenvParseOutput = {};
  const loadedEnvFiles: string[] = [];

  // Iterate over each dotenv file in lowest prio to highest prio order.
  // This step won't write to the process.env, but will overwrite the parsed envs.
  [...envFiles].reverse().forEach((envFile) => {
    try {
      const envFileContent = fs.readFileSync(envFile, 'utf8');
      const envFileParsed = dotenv.parse(envFileContent);

      // If there are parsing issues, mark the file as not-parsed
      if (!envFileParsed) {
        return debug(`Failed to load environment variables from: ${envFile}%s`);
      }

      loadedEnvFiles.push(envFile);
      debug(`Loaded environment variables from: ${envFile}`);

      for (const key of Object.keys(envFileParsed)) {
        if (typeof loadedEnvVars[key] !== 'undefined') {
          debug(`"${key}" is already defined and overwritten by: ${envFile}`);
        }

        loadedEnvVars[key] = envFileParsed[key];
      }
    } catch (error: any) {
      if ('code' in error && error.code === 'ENOENT') {
        return debug(`${envFile} does not exist, skipping this env file`);
      }
      if ('code' in error && error.code === 'EISDIR') {
        return debug(`${envFile} is a directory, skipping this env file`);
      }
      if ('code' in error && error.code === 'EACCES') {
        return debug(`No permission to read ${envFile}, skipping this env file`);
      }

      throw error;
    }
  });

  return {
    env: expandEnvFromSystem(loadedEnvVars, systemEnv),
    files: loadedEnvFiles.reverse(),
  };
}

/**
 * Parse all environment variables using the list of `.env*` files, and mutate the system environment with these variables.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
export function loadEnvFiles(
  envFiles: string[],
  {
    force,
    silent = false,
    systemEnv = process.env,
  }: Parameters<typeof parseEnvFiles>[1] & {
    /** If the environment variables should be applied to the system environment, regardless of previous mutations */
    force?: boolean;
    /** If possible misconfiguration warnings should be logged, or only logged as debug log */
    silent?: boolean;
  } = {}
) {
  if (!force && systemEnv[LOADED_ENV_NAME]) {
    return { result: 'skipped' as const, loaded: JSON.parse(systemEnv[LOADED_ENV_NAME]) };
  }

  const parsed = parseEnvFiles(envFiles, { systemEnv });
  const loadedEnvKeys: string[] = [];

  for (const key in parsed.env) {
    if (typeof systemEnv[key] !== 'undefined') {
      debug(`"${key}" is already defined and IS NOT overwritten`);
    } else {
      systemEnv[key] = parsed.env[key];
      loadedEnvKeys.push(key);
    }
  }

  // Mark the environment as loaded
  systemEnv[LOADED_ENV_NAME] = JSON.stringify(loadedEnvKeys);

  return { result: 'loaded' as const, ...parsed, loaded: loadedEnvKeys };
}

/**
 * Expand the parsed environment variables using the existing system environment variables.
 * This does not mutate the existing system environment variables, and only returns the expanded variables.
 */
function expandEnvFromSystem(
  parsedEnv: Record<string, string>,
  systemEnv: NodeJS.ProcessEnv = process.env
) {
  const expandedEnv: Record<string, string> = {};

  // Pass a clone of the system environment variables to avoid mutating the original environment.
  // When the expansion is done, we only store the environment variables that were initially parsed from `parsedEnv`.
  const allExpandedEnv = dotenvExpand({
    parsed: parsedEnv,
    processEnv: { ...systemEnv } as Record<string, string>,
  });

  if (allExpandedEnv.error) {
    console.error(
      `Failed to expand environment variables, using non-expanded environment variables: ${allExpandedEnv.error}`
    );
    return parsedEnv;
  }

  // Only store the values that were initially parsed, from `parsedEnv`.
  for (const key of Object.keys(parsedEnv)) {
    if (allExpandedEnv.parsed?.[key]) {
      expandedEnv[key] = allExpandedEnv.parsed[key];
    }
  }

  return expandedEnv;
}

/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
export function parseProjectEnv(
  projectRoot: string,
  options?: Parameters<typeof getEnvFiles>[0] & Parameters<typeof parseEnvFiles>[1]
) {
  return parseEnvFiles(
    getEnvFiles(options).map((envFile) => path.join(projectRoot, envFile)),
    options
  );
}

/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
export function loadProjectEnv(
  projectRoot: string,
  options?: Parameters<typeof getEnvFiles>[0] & Parameters<typeof loadEnvFiles>[1]
) {
  return loadEnvFiles(
    getEnvFiles(options).map((envFile) => path.join(projectRoot, envFile)),
    options
  );
}

/** Log the loaded environment info from the loaded results */
export function logLoadedEnv(
  envInfo: ReturnType<typeof loadEnvFiles>,
  options: Parameters<typeof loadEnvFiles>[1] = {}
) {
  // Skip when running in force mode, or no environment variables are loaded
  if (options.force || options.silent || !envInfo.loaded.length) return envInfo;

  // Log the loaded environment files, when not skipped
  if (envInfo.result === 'loaded') {
    console.log(
      chalk.gray('env: load', envInfo.files.map((file) => path.basename(file)).join(' '))
    );
  }

  // Log the loaded environment variables
  console.log(chalk.gray('env: export', envInfo.loaded.join(' ')));

  return envInfo;
}

// Legacy API - for backwards compatibility

let memo: ReturnType<typeof parseEnvFiles> | null = null;

/**
 * Get the environment variables without mutating the environment.
 * This returns memoized values unless the `force` property is provided.
 *
 * @deprecated use {@link parseProjectEnv} instead
 */
export function get(
  projectRoot: string,
  {
    force,
    silent,
  }: {
    force?: boolean;
    silent?: boolean;
  } = {}
) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return { env: {}, files: [] };
  }
  if (force || !memo) {
    memo = parseProjectEnv(projectRoot, { silent });
  }
  return memo;
}

/**
 * Load environment variables from .env files and mutate the current `process.env` with the results.
 *
 * @deprecated use {@link loadProjectEnv} instead
 */
export function load(
  projectRoot: string,
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return process.env;
  }

  const envInfo = get(projectRoot, options);
  const loadedEnvKeys: string[] = [];

  for (const key in envInfo.env) {
    if (typeof process.env[key] !== 'undefined') {
      debug(`"${key}" is already defined and IS NOT overwritten`);
    } else {
      // Avoid creating a new object, mutate it instead as this causes problems in Bun
      process.env[key] = envInfo.env[key];
      loadedEnvKeys.push(key);
    }
  }

  // Port the result of `get` to the newer result object
  logLoadedEnv({ ...envInfo, result: 'loaded', loaded: loadedEnvKeys }, options);

  return process.env;
}

/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @deprecated use {@link getEnvFiles} instead
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
export function getFiles(mode: string | undefined, { silent = false }: { silent?: boolean } = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return [];
  }

  return getEnvFiles({ mode, silent });
}
