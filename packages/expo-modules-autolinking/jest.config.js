const sharedPreset = require('expo-module-scripts/jest-preset-plugin');
module.exports = {
  ...sharedPreset,
  roots: ['src', 'e2e'],
};
