"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOADED_ENV_NAME = exports.KNOWN_MODES = void 0;
exports.get = get;
exports.getEnvFiles = getEnvFiles;
exports.getFiles = getFiles;
exports.isEnabled = isEnabled;
exports.load = load;
exports.loadEnvFiles = loadEnvFiles;
exports.loadProjectEnv = loadProjectEnv;
exports.logLoadedEnv = logLoadedEnv;
exports.parseEnvFiles = parseEnvFiles;
exports.parseProjectEnv = parseProjectEnv;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function dotenv() {
  const data = _interopRequireWildcard(require("dotenv"));
  dotenv = function () {
    return data;
  };
  return data;
}
function _dotenvExpand() {
  const data = require("dotenv-expand");
  _dotenvExpand = function () {
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
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = require('debug')('expo:env');

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
      files: []
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

  // Iterate over each dotenv file in lowest prio to highest prio order.
  // This step won't write to the process.env, but will overwrite the parsed envs.
  [...envFiles].reverse().forEach(envFile => {
    try {
      const envFileContent = _nodeFs().default.readFileSync(envFile, 'utf8');
      const envFileParsed = dotenv().parse(envFileContent);

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
  return {
    env: expandEnvFromSystem(loadedEnvVars, systemEnv),
    files: loadedEnvFiles.reverse()
  };
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
      systemEnv[key] = parsed.env[key];
      loadedEnvKeys.push(key);
    }
  }

  // Mark the environment as loaded
  systemEnv[LOADED_ENV_NAME] = JSON.stringify(loadedEnvKeys);
  return {
    result: 'loaded',
    ...parsed,
    loaded: loadedEnvKeys
  };
}

/**
 * Expand the parsed environment variables using the existing system environment variables.
 * This does not mutate the existing system environment variables, and only returns the expanded variables.
 */
function expandEnvFromSystem(parsedEnv, systemEnv = process.env) {
  const expandedEnv = {};

  // Pass a clone of the system environment variables to avoid mutating the original environment.
  // When the expansion is done, we only store the environment variables that were initially parsed from `parsedEnv`.
  const allExpandedEnv = (0, _dotenvExpand().expand)({
    parsed: parsedEnv,
    processEnv: {
      ...systemEnv
    }
  });
  if (allExpandedEnv.error) {
    _nodeConsole().default.error(`Failed to expand environment variables, using non-expanded environment variables: ${allExpandedEnv.error}`);
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
      files: []
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
//# sourceMappingURL=index.js.map