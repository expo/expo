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
  if (Array.isArray(config.projects)) {
    let projectsWantPass = false;
    config.projects = config.projects.map((project) => {
      if (project && typeof project === 'object') {
        // `watchPlugins` and `passWithNoTests` are root-only options in multi-project mode.
        // Strip them from each project to avoid Jest's validation warnings.
        const { watchPlugins, passWithNoTests, ...rest } = project;
        if ('passWithNoTests' in project) {
          projectsWantPass ||= passWithNoTests;
        }
        return rest;
      }
      return project;
    });
    config.passWithNoTests ??= projectsWantPass;
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
