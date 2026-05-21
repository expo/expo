"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOADED_ENV_NAME = exports.KNOWN_MODES = void 0;
exports.get = get;
exports.getEnvFiles = getEnvFiles;
exports.getFiles = getFiles;
exports.getOriginalEnv = getOriginalEnv;
exports.getOriginalEnvValue = getOriginalEnvValue;
exports.isEnabled = isEnabled;
exports.load = load;
exports.loadEnvFiles = loadEnvFiles;
exports.loadProjectEnv = loadProjectEnv;
exports.logLoadedEnv = logLoadedEnv;
exports.parseEnv = parseEnv;
exports.parseEnvFiles = parseEnvFiles;
exports.parseProjectEnv = parseProjectEnv;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
function _nodeConsole() {
  const data = _interopRequireDefault(require("node:console"));
  _nodeConsole = function () {
    return data;
  };
  return data;
}
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _nodePath() {
  const data = _interopRequireDefault(require("node:path"));
  _nodePath = function () {
    return data;
  };
  return data;
}
function _constants() {
  const data = require("./constants");
  _constants = function () {
    return data;
  };
  return data;
}
function _parse() {
  const data = require("./parse");
  _parse = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = require('debug')('expo:env');
const ORIGINAL_ENV_BACKUP_KEY = Symbol.for('@expo/env.originalEnvBackup.v1');
const globalStore = globalThis;
const originalEnvBackup = globalStore[ORIGINAL_ENV_BACKUP_KEY] ?? (globalStore[ORIGINAL_ENV_BACKUP_KEY] = new WeakMap());
function rememberOriginal(systemEnv, key) {
  if ((0, _constants().isUnsafeAllowedEnvKey)(key)) return;
  let backup = originalEnvBackup.get(systemEnv);
  if (!backup) {
    backup = new Map();
    originalEnvBackup.set(systemEnv, backup);
  }
  if (!backup.has(key)) {
    backup.set(key, systemEnv[key]);
  }
}

/** Determine if the `.env` files are enabled or not, through `EXPO_NO_DOTENV` */
function isEnabled() {
  return !(0, _getenv().boolish)('EXPO_NO_DOTENV', false);
}

/** All conventional modes that should not cause warnings */
const KNOWN_MODES = exports.KNOWN_MODES = ['development', 'test', 'production'];

/** The environment variable name to use when marking the environment as loaded */
const LOADED_ENV_NAME = exports.LOADED_ENV_NAME = '__EXPO_ENV_LOADED';

/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
function getEnvFiles({
  mode = process.env.NODE_ENV,
  silent
} = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return [];
  }
  const logError = silent ? debug : _nodeConsole().default.error;
  const logWarning = silent ? debug : _nodeConsole().default.warn;
  if (!mode) {
    logError(`The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set. Using only .env.local and .env`);
    return ['.env.local', '.env'];
  }
  if (!KNOWN_MODES.includes(mode)) {
    logWarning(`NODE_ENV="${mode}" is non-conventional and might cause development code to run in production. Use "development", "test", or "production" instead. Continuing with non-conventional mode`);
  }

  // see: https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
  return [`.env.${mode}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  mode !== 'test' && `.env.local`, `.env.${mode}`, `.env`].filter(Boolean);
}

/**
 * Parse all environment variables using the list of `.env*` files, in order of higest priority to lowest priority.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
function parseEnvFiles(envFiles, {
  systemEnv = process.env
} = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return {
      env: {},
      files: [],
      sensitiveLoadedKeys: []
    };
  }

  // Load environment variables from .env* files. Suppress warnings using silent
  // if this file is missing. Dotenv will only parse the environment variables,
  // `@expo/env` will set the resulting variables to the current process.
  // Variable expansion is supported in .env files, and executed as final step.
  // https://github.com/motdotla/dotenv
  // https://github.com/motdotla/dotenv-expand
  const loadedEnvVars = {};
  const loadedEnvFiles = [];
  const blockedByFile = {};
  const localOnlyByFile = {};
  const sensitive = new Set();

  // Iterate over each dotenv file in lowest prio to highest prio order.
  // This step won't write to the process.env, but will overwrite the parsed envs.
  [...envFiles].reverse().forEach(envFile => {
    try {
      const envFileContent = _nodeFs().default.readFileSync(envFile, 'utf8');
      const envFileParsed = (0, _parse().parse)(envFileContent);
      const isLocalFile = _nodePath().default.basename(envFile).endsWith('.local');
      loadedEnvFiles.push(envFile);
      debug(`Loaded environment variables from: ${envFile}`);
      for (const key of Object.keys(envFileParsed)) {
        if ((0, _constants().isIgnoredEnvKey)(key)) {
          (blockedByFile[envFile] ||= []).push(key);
          debug(`"${key}" is blocked from dotenv files, skipping in: ${envFile}`);
          continue;
        }
        if (!isLocalFile && (0, _constants().isLocalEnvKey)(key)) {
          (localOnlyByFile[envFile] ||= []).push(key);
          debug(`"${key}" is only allowed in .local env files, skipping in: ${envFile}`);
          continue;
        }
        if (isLocalFile && (0, _constants().isLocalEnvKey)(key)) {
          sensitive.add(key);
        }
        if (typeof loadedEnvVars[key] !== 'undefined') {
          debug(`"${key}" is already defined and overwritten by: ${envFile}`);
        }
        loadedEnvVars[key] = envFileParsed[key];
      }
    } catch (error) {
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
  const violations = [];
  if (Object.keys(blockedByFile).length > 0) {
    violations.push(formatBlockedViolation(blockedByFile));
  }
  if (Object.keys(localOnlyByFile).length > 0) {
    violations.push(formatLocalOnlyViolation(localOnlyByFile));
  }
  if (violations.length > 0) {
    throw new Error(violations.join('\n\n'));
  }
  const env = (0, _parse().expand)(loadedEnvVars, systemEnv);
  for (const key in env) {
    rememberOriginal(systemEnv, key);
  }
  return {
    env,
    files: loadedEnvFiles.reverse(),
    sensitiveLoadedKeys: [...sensitive]
  };
}
function formatViolationFiles(byFile) {
  return Object.entries(byFile).map(([file, keys]) => `  ${_nodePath().default.basename(file)}: ${keys.join(', ')}`).join('\n');
}
function formatBlockedViolation(byFile) {
  return ['Refused to load dangerous environment variables from .env files.', 'Opt in via EXPO_UNSAFE_DOTENV_KEYS in your shell environment if you truly need them.', '', formatViolationFiles(byFile)].join('\n');
}
function formatLocalOnlyViolation(byFile) {
  return ['Refused to load personal environment variables from a non-.local env file.', 'Move them to a .local env file.', '', formatViolationFiles(byFile)].join('\n');
}

/**
 * Parse all environment variables using the list of `.env*` files, and mutate the system environment with these variables.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
function loadEnvFiles(envFiles, {
  force,
  silent = false,
  systemEnv = process.env
} = {}) {
  if (!force && systemEnv[LOADED_ENV_NAME]) {
    return {
      result: 'skipped',
      loaded: JSON.parse(systemEnv[LOADED_ENV_NAME])
    };
  }
  const parsed = parseEnvFiles(envFiles, {
    systemEnv
  });
  const loadedEnvKeys = [];
  for (const key in parsed.env) {
    if (typeof systemEnv[key] !== 'undefined') {
      debug(`"${key}" is already defined and IS NOT overwritten`);
    } else {
      rememberOriginal(systemEnv, key);
      systemEnv[key] = parsed.env[key];
      loadedEnvKeys.push(key);
    }
  }

  // Mark the environment as loaded
  rememberOriginal(systemEnv, LOADED_ENV_NAME);
  systemEnv[LOADED_ENV_NAME] = JSON.stringify(loadedEnvKeys);
  return {
    result: 'loaded',
    ...parsed,
    loaded: loadedEnvKeys
  };
}

/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
function parseProjectEnv(projectRoot, options) {
  return parseEnvFiles(getEnvFiles(options).map(envFile => _nodePath().default.join(projectRoot, envFile)), options);
}

/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
function loadProjectEnv(projectRoot, options) {
  return loadEnvFiles(getEnvFiles(options).map(envFile => _nodePath().default.join(projectRoot, envFile)), options);
}

/**
 * Get a fresh clone of the system environment with all `@expo/env`-applied
 * mutations reverted to their pre-load values. The result is intended to be
 * passed as the `env` option of `child_process.spawn` / `@expo/spawn-async`
 * when a subprocess should observe the environment as it was before any
 * `.env*` files were loaded — for example, when resolving SDK tooling paths
 * that should not be influenced by project-controlled `.env` values.
 *
 * Allocates lazily: nothing is held until this function is called, and each
 * call returns a new object so callers may mutate it freely.
 *
 * @param systemEnv The env to revert against; defaults to `process.env`.
 */
function getOriginalEnv(systemEnv = process.env) {
  const result = {
    ...systemEnv
  };
  const backup = originalEnvBackup.get(systemEnv);
  if (backup) {
    for (const [key, original] of backup) {
      if (original === undefined) {
        delete result[key];
      } else {
        result[key] = original;
      }
    }
  }
  return result;
}

/**
 * Get the pre-load value of a single environment variable as recorded by
 * `@expo/env`. Falls through to the value in `systemEnv` for keys that
 * `@expo/env` never touched. O(1) and allocation-free, intended for read-sites
 * that resolve filesystem paths or executables from a single env var.
 *
 * Honors `EXPO_UNSAFE_DOTENV_KEYS`: keys the caller has explicitly opted into
 * via the escape hatch return their currently loaded value, not the original.
 *
 * @param key The environment variable to read.
 * @param systemEnv The env to read against; defaults to `process.env`.
 */
function getOriginalEnvValue(key, systemEnv = process.env) {
  const backup = originalEnvBackup.get(systemEnv);
  if (backup && backup.has(key)) {
    return backup.get(key);
  }
  return systemEnv[key];
}

/** Log the loaded environment info from the loaded results */
function logLoadedEnv(envInfo, options = {}) {
  // Skip when running in force mode, or no environment variables are loaded
  if (options.force || options.silent || !envInfo.loaded.length) return envInfo;

  // Log the loaded environment files, when not skipped
  if (envInfo.result === 'loaded') {
    _nodeConsole().default.log(_chalk().default.gray('env: load', envInfo.files.map(file => _nodePath().default.basename(file)).join(' ')));
  }

  // Log the loaded environment variables
  _nodeConsole().default.log(_chalk().default.gray('env: export', envInfo.loaded.join(' ')));

  // Highlight developer-tool roots / secrets that were loaded from a .local file —
  // the same keys would be refused from any non-.local file. Surfacing them here
  // tells the user which "sensitive" values are influencing the build.
  if (envInfo.result === 'loaded' && envInfo.sensitiveLoadedKeys?.length) {
    _nodeConsole().default.log(_chalk().default.yellow('env: export (sensitive)', envInfo.sensitiveLoadedKeys.join(' ')));
  }
  return envInfo;
}

// Legacy API - for backwards compatibility

let memo = null;

/**
 * Get the environment variables without mutating the environment.
 * This returns memoized values unless the `force` property is provided.
 *
 * @deprecated use {@link parseProjectEnv} instead
 */
function get(projectRoot, {
  force,
  silent
} = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return {
      env: {},
      files: [],
      sensitiveLoadedKeys: []
    };
  }
  if (force || !memo) {
    memo = parseProjectEnv(projectRoot, {
      silent
    });
  }
  return memo;
}

/**
 * Load environment variables from .env files and mutate the current `process.env` with the results.
 *
 * @deprecated use {@link loadProjectEnv} instead
 */
function load(projectRoot, options = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return process.env;
  }
  const envInfo = get(projectRoot, options);
  const loadedEnvKeys = [];
  for (const key in envInfo.env) {
    if (typeof process.env[key] !== 'undefined') {
      debug(`"${key}" is already defined and IS NOT overwritten`);
    } else {
      // Avoid creating a new object, mutate it instead as this causes problems in Bun
      rememberOriginal(process.env, key);
      process.env[key] = envInfo.env[key];
      loadedEnvKeys.push(key);
    }
  }

  // Port the result of `get` to the newer result object
  logLoadedEnv({
    ...envInfo,
    result: 'loaded',
    loaded: loadedEnvKeys
  }, options);
  return process.env;
}

/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @deprecated use {@link getEnvFiles} instead
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
function getFiles(mode, {
  silent = false
} = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return [];
  }
  return getEnvFiles({
    mode,
    silent
  });
}

/**
 * Parses the contents of a single `.env` file, optionally expanding it immediately.
 */
function parseEnv(contents, sourceEnv) {
  try {
    const env = (0, _parse().parse)(contents);
    for (const key in env) {
      if ((0, _constants().isIgnoredEnvKey)(key)) {
        delete env[key];
      }
    }
    return (0, _parse().expand)(env, sourceEnv || {});
  } catch {
    return {};
  }
}
//# sourceMappingURL=index.js.map