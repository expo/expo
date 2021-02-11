const assert = require('assert');
const process = require('process');

module.exports = function(api) {
  assert.equal(process.env.NODE_ENV, 'test');
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
