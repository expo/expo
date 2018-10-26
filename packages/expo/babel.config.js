const assert = require('assert');
const process = require('process');

module.exports = function(api) {
  assert.equal(process.env.NODE_ENV, 'test');
  api.cache(true);

  return {
    plugins: [['@babel/plugin-transform-modules-commonjs', { lazy: true }]],
    presets: ['babel-preset-expo'],
  };
};
