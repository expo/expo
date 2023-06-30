"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createControlledEnvironment = createControlledEnvironment;
exports.getFiles = getFiles;
exports.isEnabled = isEnabled;
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
function fs() {
  const data = _interopRequireWildcard(require("fs"));
  fs = function () {
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
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const debug = require('debug')('expo:env');
function isEnabled() {
  return !(0, _getenv().boolish)('EXPO_NO_DOTENV', false);
}
function createControlledEnvironment() {
  const IS_DEBUG = require('debug').enabled('expo:env');
  let userDefinedEnvironment = undefined;
  let memo = undefined;
  function _getForce(projectRoot, options = {}) {
    if (!isEnabled()) {
      debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
      return {
        env: {},
        files: []
      };
    }
    if (!userDefinedEnvironment) {
      userDefinedEnvironment = {
        ...process.env
      };
    }

    // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
    const dotenvFiles = getFiles(process.env.NODE_ENV, options);
    const loadedEnvFiles = [];
    const parsed = {};

    // Load environment variables from .env* files. Suppress warnings using silent
    // if this file is missing. dotenv will never modify any environment variables
    // that have already been set. Variable expansion is supported in .env files.
    // https://github.com/motdotla/dotenv
    // https://github.com/motdotla/dotenv-expand
    dotenvFiles.forEach(dotenvFile => {
      const absoluteDotenvFile = path().resolve(projectRoot, dotenvFile);
      if (!fs().existsSync(absoluteDotenvFile)) {
        return;
      }
      try {
        const results = (0, _dotenvExpand().expand)(dotenv().config({
          debug: IS_DEBUG,
          path: absoluteDotenvFile,
          // We will handle overriding ourselves to allow for HMR.
          override: true
        }));
        if (results.parsed) {
          loadedEnvFiles.push(absoluteDotenvFile);
          debug(`Loaded environment variables from: ${absoluteDotenvFile}`);
          for (const key of Object.keys(results.parsed || {})) {
            var _userDefinedEnvironme;
            if (typeof parsed[key] === 'undefined' &&
            // Custom override logic to prevent overriding variables that
            // were set before the CLI process began.
            typeof ((_userDefinedEnvironme = userDefinedEnvironment) === null || _userDefinedEnvironme === void 0 ? void 0 : _userDefinedEnvironme[key]) === 'undefined') {
              parsed[key] = results.parsed[key];
            }
          }
        } else {
          debug(`Failed to load environment variables from: ${absoluteDotenvFile}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Failed to load environment variables from ${absoluteDotenvFile}: ${error.message}`);
        } else {
          throw error;
        }
      }
    });
    if (!loadedEnvFiles.length) {
      debug(`No environment variables loaded from .env files.`);
    }
    return {
      env: parsed,
      files: loadedEnvFiles
    };
  }

  /** Get the environment variables without mutating the environment. This returns memoized values unless the `force` property is provided. */
  function get(projectRoot, options = {}) {
    if (!isEnabled()) {
      debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
      return {
        env: {},
        files: []
      };
    }
    if (!options.force && memo) {
      return memo;
    }
    memo = _getForce(projectRoot, options);
    return memo;
  }

  /** Load environment variables from .env files and mutate the current `process.env` with the results. */
  function load(projectRoot, options = {}) {
    if (!isEnabled()) {
      debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
      return process.env;
    }
    const envInfo = get(projectRoot, options);
    if (!options.force) {
      const keys = Object.keys(envInfo.env);
      if (keys.length) {
        console.log(_chalk().default.gray('env: load', envInfo.files.map(file => path().basename(file)).join(' ')));
        console.log(_chalk().default.gray('env: export', keys.join(' ')));
      }
    }
    process.env = {
      ...process.env,
      ...envInfo.env
    };
    return process.env;
  }
  return {
    load,
    get,
    _getForce
  };
}
function getFiles(mode, {
  silent = false
} = {}) {
  if (!isEnabled()) {
    debug(`Skipping .env files because EXPO_NO_DOTENV is defined`);
    return [];
  }
  if (!mode) {
    if (silent) {
      debug('NODE_ENV is not defined, proceeding without mode-specific .env');
    } else {
      console.error(_chalk().default.red('The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set.'));
      console.error(_chalk().default.red('Proceeding without mode-specific .env'));
    }
  }
  if (mode && !['development', 'test', 'production'].includes(mode)) {
    throw new Error(`Environment variable "NODE_ENV=${mode}" is invalid. Valid values are "development", "test", and "production`);
  }
  if (!mode) {
    // Support environments that don't respect NODE_ENV
    return [`.env.local`, '.env'];
  }
  // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
  const dotenvFiles = [`.env.${mode}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  mode !== 'test' && `.env.local`, `.env.${mode}`, '.env'].filter(Boolean);
  return dotenvFiles;
}
//# sourceMappingURL=env.js.map