const sharedPreset = require('expo-module-scripts/jest-preset-plugin');
module.exports = {
  ...sharedPreset,
  roots: ['__mocks__', 'src', 'e2e'],
};
