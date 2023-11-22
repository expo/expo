const path = require('path');

module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  preset: 'ts-jest',
  displayName: require('./package').name,
  rootDir: path.resolve(__dirname),
  roots: ['src'],
};
