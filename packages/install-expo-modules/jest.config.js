const path = require('path');

module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  displayName: require('./package').name,
  rootDir: path.resolve(__dirname),
  roots: ['src'],
};
