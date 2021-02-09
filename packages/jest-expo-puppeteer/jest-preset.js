'use strict';

const jestPreset = require('jest-puppeteer/jest-preset');

module.exports = {
  ...jestPreset,
  moduleFileExtensions: ['js', 'json', 'node'],
  resetModules: false,
};
