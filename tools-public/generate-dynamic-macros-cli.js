#!/usr/bin/env node

'use strict';

const minimist = require('minimist');
const { generateDynamicMacrosAsync } = require('./generate-dynamic-macros');

const argv = minimist(process.argv.slice(2));

if (!argv.buildConstantsPath) {
  throw new Error('Must run with `--buildConstantsPath BUILD_CONSTANTS_PATH`');
}

if (!argv.platform) {
  throw new Error('Must run with `--platform PLATFORM`');
}

if (argv.platform === 'ios' && !argv.infoPlistPath) {
  throw new Error('iOS must run with `--infoPlistPath INFO_PLIST_PATH`');
}

generateDynamicMacrosAsync(argv)
