const defaultTransformer = require('../../packages/@expo/metro-config/build/babel-transformer');

// Keep this wrapper observably distinct from Expo's default transformer so the
// transform worker exercises its pristine-source custom-transformer/Babel path.
// It is selected only by the router-e2e performance switch in metro.config.js.
module.exports = {
  ...defaultTransformer,
  transform(...args) {
    return defaultTransformer.transform(...args);
  },
};
