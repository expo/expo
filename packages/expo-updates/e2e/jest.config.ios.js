const expoDefault = require('expo-module-scripts/jest-preset-plugin');

module.exports = {
  ...expoDefault,
  moduleFileExtensions: ['ios.ts', 'ts', 'js', 'json'],
};
