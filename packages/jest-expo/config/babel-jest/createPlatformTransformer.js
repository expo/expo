const { createTransformer } = require('babel-jest');

const createPlatformTransformer = (platform) =>
  createTransformer({
    // Babel caller, this is traditionally injected by the bundler.
    caller: {
      // name: 'metro',
      platform,
    },
  });

module.exports = {
  createPlatformTransformer,
};
