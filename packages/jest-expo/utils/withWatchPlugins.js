function getWatchPlugins({ projects = [] } = {}) {
  const watchPlugins = [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ];
  if (projects.length) {
    watchPlugins.push(require.resolve('jest-watch-select-projects'));
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
