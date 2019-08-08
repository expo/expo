#!/usr/bin/env node
'use strict';

const minimist = require('minimist');
const process = require('process');
const path = require('path');

const spawnSync = require('../common/cross-spawn-sync');

let argv = minimist(process.argv.slice(2));
switch (argv._[0]) {
  case 'check-workspace-dependencies':
    spawnSync('node', [path.join(__dirname, 'check-workspace-dependencies.js')], {
      stdio: 'inherit',
    });
    break;

  case 'postinstall':
    spawnSync('node', [path.join(__dirname, 'symlink-necessary-packages.js')], {
      stdio: 'inherit',
    });
    spawnSync('node', [path.join(__dirname, 'make-entry-module.js')], {
      stdio: 'inherit',
    });
    break;
}
