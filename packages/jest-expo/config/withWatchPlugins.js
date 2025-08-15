const chalk = require('chalk');

/**
 * Resolve and return the `watchPlugins` configuration, using:
 *   - jest-watch-typeahead/filename
 *   - jest-watch-typeahead/testname
 *   - jest-watch-select-projects, if `projects` is defined as a non-empty array
 *
 * @see https://jestjs.io/docs/configuration#watchplugins-arraystring--string-object
 * @param {import('jest').Config} config
 * @return {import('jest').Config}
 */
function getWatchPlugins({ projects = [] } = {}) {
  const watchPlugins = [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ];
  if (projects.length) {
    watchPlugins.push([
      require.resolve('jest-watch-select-projects'),
      {
        key: 'X',
        prompt() {
          return `select which PLATFORMS to run ${chalk.italic(this._getActiveProjectsText())}`;
        },
      },
    ]);
  }
  return watchPlugins;
}

/**
 * Add the following Jest watch plugins to the config:
 *   - jest-watch-typeahead/filename
 *   - jest-watch-typeahead/testname
 *   - jest-watch-select-projects, if `projects` is defined as a non-empty array
 *
 * @note This also drops the `watchPlugins` from the individual `projects.*`, when defined.
 * @see https://jestjs.io/docs/configuration#watchplugins-arraystring--string-object
 * @param {import('jest').Config} config
 * @return {import('jest').Config}
 */
function withWatchPlugins({ watchPlugins = [], ...config }) {
  const customPlugins = getWatchPlugins(config);

  // Remove sub-watch-plugins from the preset when using multi-project runner.
  if (config.projects) {
    for (const project of config.projects) {
      if (typeof project === 'object' && project.watchPlugins) {
        delete project.watchPlugins;
      }
    }
  }

  return {
    ...config,
    watchPlugins: [...watchPlugins, ...customPlugins],
  };
}

module.exports = {
  getWatchPlugins,
  withWatchPlugins,
};
