'use strict';

const jestPreset = require('jest-puppeteer/jest-preset');

module.exports = {
  ...jestPreset,
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/*-test.web.js'],
  resetModules: false,
};
