const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');

module.exports = {
  process: (_, filename) => `module.exports = 1;`,
  getCacheKey: createCacheKeyFunction([__filename]),
};
