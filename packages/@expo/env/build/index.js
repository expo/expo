"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOADED_ENV_NAME = exports.KNOWN_MODES = void 0;
exports.isEnabled = isEnabled;
exports.getEnvFiles = getEnvFiles;
exports.parseEnvFiles = parseEnvFiles;
exports.loadEnvFiles = loadEnvFiles;
exports.parseProjectEnv = parseProjectEnv;
exports.loadProjectEnv = loadProjectEnv;
exports.logLoadedEnv = logLoadedEnv;
exports.get = get;
exports.load = load;
exports.getFiles = getFiles;
const chalk_1 = __importDefault(require("chalk"));
const dotenv = __importStar(require("dotenv"));
const dotenv_expand_1 = require("dotenv-expand");
const getenv_1 = require("getenv");
const node_console_1 = __importDefault(require("node:console"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const debug = require('debug')('expo:env');
/** Determine if the `.env` files are enabled or not, through `EXPO_NO_DOTENV` */
function isEnabled() {
    return !(0, getenv_1.boolish)('EXPO_NO_DOTENV', false);
}
/** All conventional modes that should not cause warnings */
exports.KNOWN_MODES = ['development', 'test', 'production'];
/** The environment variable name to use when marking the environment as loaded */
exports.LOADED_ENV_NAME = '__EXPO_ENV_LOADED';
const overwrittenKeys = new Set();
/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
function getEnvFiles({ mode = process.env.NODE_ENV, silent, } = {}) {
    if (!isEnabled()) {
        debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
        return [];
    }
    const logError = silent ? debug : node_console_1.default.error;
    const logWarning = silent ? debug : node_console_1.default.warn;
    if (!mode) {
        logError(`The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set. Using only .env.local and .env`);
        return ['.env.local', '.env'];
    }
    if (!exports.KNOWN_MODES.includes(mode)) {
        logWarning(`NODE_ENV="${mode}" is non-conventional and might cause development code to run in production. Use "development", "test", or "production" instead. Continuing with non-conventional mode`);
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
    ].filter(Boolean);
}
/**
 * Parse all environment variables using the list of `.env*` files, in order of higest priority to lowest priority.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
function parseEnvFiles(envFiles, { systemEnv = process.env, } = {}) {
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
    const loadedEnvVars = {};
    const loadedEnvFiles = [];
    // Iterate over each dotenv file in lowest prio to highest prio order.
    // This step won't write to the process.env, but will overwrite the parsed envs.
    [...envFiles].reverse().forEach((envFile) => {
        try {
            const envFileContent = node_fs_1.default.readFileSync(envFile, 'utf8');
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
        }
        catch (error) {
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
function loadEnvFiles(envFiles, { force, silent = false, systemEnv = process.env, } = {}) {
    if (!force && systemEnv[exports.LOADED_ENV_NAME]) {
        return { result: 'skipped', loaded: JSON.parse(systemEnv[exports.LOADED_ENV_NAME]) };
    }
    const parsed = parseEnvFiles(envFiles, { systemEnv });
    const loadedEnvKeys = [];
    for (const key in parsed.env) {
        if (typeof systemEnv[key] !== 'undefined' &&
            // If the key was previously overwritten by the .env file then it can be overwritten again.
            !overwrittenKeys.has(key)) {
            debug(`"${key}" is already defined and IS NOT overwritten`);
        }
        else {
            overwrittenKeys.add(key);
            systemEnv[key] = parsed.env[key];
            loadedEnvKeys.push(key);
        }
    }
    // Mark the environment as loaded
    systemEnv[exports.LOADED_ENV_NAME] = JSON.stringify(loadedEnvKeys);
    return { result: 'loaded', ...parsed, loaded: loadedEnvKeys };
}
/**
 * Expand the parsed environment variables using the existing system environment variables.
 * This does not mutate the existing system environment variables, and only returns the expanded variables.
 */
function expandEnvFromSystem(parsedEnv, systemEnv = process.env) {
    const expandedEnv = {};
    const originalEnv = { ...systemEnv };
    overwrittenKeys.forEach((key) => {
        delete originalEnv[key];
    });
    // Pass a clone of the system environment variables to avoid mutating the original environment.
    // When the expansion is done, we only store the environment variables that were initially parsed from `parsedEnv`.
    const allExpandedEnv = (0, dotenv_expand_1.expand)({
        parsed: parsedEnv,
        processEnv: originalEnv,
    });
    if (allExpandedEnv.error) {
        node_console_1.default.error(`Failed to expand environment variables, using non-expanded environment variables: ${allExpandedEnv.error}`);
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
    return parseEnvFiles(getEnvFiles(options).map((envFile) => node_path_1.default.join(projectRoot, envFile)), options);
}
/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
function loadProjectEnv(projectRoot, options) {
    return loadEnvFiles(getEnvFiles(options).map((envFile) => node_path_1.default.join(projectRoot, envFile)), options);
}
/** Log the loaded environment info from the loaded results */
function logLoadedEnv(envInfo, options = {}) {
    // Skip when running in force mode, or no environment variables are loaded
    if (options.force || options.silent || !envInfo.loaded.length)
        return envInfo;
    // Log the loaded environment files, when not skipped
    if (envInfo.result === 'loaded') {
        node_console_1.default.log(chalk_1.default.gray('env: load', envInfo.files.map((file) => node_path_1.default.basename(file)).join(' ')));
    }
    // Log the loaded environment variables
    node_console_1.default.log(chalk_1.default.gray('env: export', envInfo.loaded.join(' ')));
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
function get(projectRoot, { force, silent, } = {}) {
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
function load(projectRoot, options = {}) {
    if (!isEnabled()) {
        debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
        return process.env;
    }
    const envInfo = get(projectRoot, options);
    const loadedEnvKeys = [];
    for (const key in envInfo.env) {
        if (typeof process.env[key] !== 'undefined' &&
            // If the key was previously overwritten by the .env file then it can be overwritten again.
            !overwrittenKeys.has(key)) {
            debug(`"${key}" is already defined and IS NOT overwritten`);
        }
        else {
            // Avoid creating a new object, mutate it instead as this causes problems in Bun
            overwrittenKeys.add(key);
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
function getFiles(mode, { silent = false } = {}) {
    if (!isEnabled()) {
        debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
        return [];
    }
    return getEnvFiles({ mode, silent });
}
