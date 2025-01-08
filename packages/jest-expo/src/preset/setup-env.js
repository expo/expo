'use strict';

const path = require('path');

/**
 * Load the dotenv files into the current system environment.
 * The `target` has to be specified in order to load the correct environment variables.
 *   - server - All environment variables from `.env*` files are loaded into system variables
 *   - client - Only `EXPO_PUBLIC_` prefixed environment variables are loaded.
 *
 * @param {object} options
 * @param {"server"|"client"} options.target
 */
function load(options) {
  try {
    const expoPath = path.dirname(require.resolve('expo/package.json'));
    const expoCliPath = path.dirname(require.resolve('@expo/cli/package.json'), {
      paths: [expoPath],
    });

    /**
     * Dependency chain: expo -> @expo/config
     * @type {import('@expo/config/paths')}
     */
    const { getPossibleProjectRoot } = require(
      require.resolve('@expo/config/paths', { paths: [expoPath] })
    );

    /**
     * Dependency chain: expo -> @expo/cli -> @expo/env
     * @type {import('@expo/env')}
     */
    const expoEnv = require(require.resolve('@expo/env', { paths: [expoCliPath] }));

    // Parse the environment variables from dotenv
    const envInfo = expoEnv.parseProjectEnv(getPossibleProjectRoot());
    // Apply the environment variables to the current `process.env` - when not defined
    // Possibly filter environment variables with `EXPO_PUBLIC_` when targeting clients
    for (const key in envInfo.env) {
      if (options.target === 'client' && !key.startsWith('EXPO_PUBLIC_')) {
        continue;
      }

      if (typeof process.env[key] === 'undefined') {
        process.env[key] = envInfo.env[key];
      }
    }
  } catch (error) {
    console.warn('env: failed to load environment variables from dotenv files', error);
  }
}

module.exports = { load };
