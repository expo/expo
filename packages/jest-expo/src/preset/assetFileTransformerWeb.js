const createCacheKeyFunction = require('@jest/create-cache-key-function').default;

module.exports = {
  process: (_, filename) => ({ code: `module.exports = "";` }),
  getCacheKey: createCacheKeyFunction([__filename]),
};
