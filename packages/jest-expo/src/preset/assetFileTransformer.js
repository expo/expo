const createCacheKeyFunction = require('@jest/create-cache-key-function');

module.exports = {
  process: (_, filename) => `module.exports = 1;`,
  getCacheKey: createCacheKeyFunction([__filename]),
};
