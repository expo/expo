const chalk = require('chalk');

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

function withWatchPlugins({ watchPlugins = [], ...config }) {
  const customPlugins = getWatchPlugins(config);
  return {
    ...config,
    watchPlugins: [...watchPlugins, ...customPlugins],
  };
}

module.exports = {
  getWatchPlugins,
  withWatchPlugins,
};
