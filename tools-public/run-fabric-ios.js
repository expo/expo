#!/usr/bin/env node

'use strict';

const minimist = require('minimist');
const { runFabricIOSAsync } = require('./generate-dynamic-macros');

const argv = minimist(process.argv.slice(2));

if (!argv.fabricPath || !argv.iosPath) {
  throw new Error('Must run with `--fabricPath` and `--iosPath`');
}

runFabricIOSAsync(argv);
