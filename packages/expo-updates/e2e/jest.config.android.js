const expoDefault = require('expo-module-scripts/jest-preset-plugin');

module.exports = {
  ...expoDefault,
  moduleFileExtensions: ['android.ts', 'ts', 'js', 'json'],
};
