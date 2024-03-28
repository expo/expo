'use strict';

const path = require('path');

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

    // Auto-load the environment variables from the possible project root
    expoEnv.load(getPossibleProjectRoot(), options);
  } catch (error) {
    console.warn('env: failed to load environment variables from dotenv files', error);
  }
}

module.exports = { load };
