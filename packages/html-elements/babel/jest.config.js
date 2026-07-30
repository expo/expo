const path = require('path');

module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  rootDir: path.resolve(__dirname),
  displayName: require('../package').name,
  roots: ['.'],
};
