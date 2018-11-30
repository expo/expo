#!/usr/bin/env node
'use strict';

// Validate that used Node version is supported
const process = require('process');
const semver = require('semver');
const ver = process.versions.node.split('-')[0]; // explode and truncate tag from version

if (semver.satisfies(ver, '>=8.9.0')) {
  require('../build/expotools-cli.js').run();
} else {
  console.log(
    require('chalk').red(
      'Node version ' + ver + ' is not supported. Please use Node.js 8.9.0 or higher.'
    )
  );
  process.exit(1);
}
