#!/usr/bin/env node
'use strict';

const minimist = require('minimist');
const process = require('process');
const path = require('path');

const spawnSync = require('../common/cross-spawn-sync');

let argv = minimist(process.argv.slice(2));
switch (argv._[0]) {
  case 'check-workspace-dependencies':
    _spawnSubprocess('node', [path.join(__dirname, 'check-workspace-dependencies.js')], {
      stdio: 'inherit',
    });
    break;

  case 'postinstall':
    _spawnSubprocess('node', [path.join(__dirname, 'symlink-necessary-packages.js')], {
      stdio: 'inherit',
    });
    _spawnSubprocess('node', [path.join(__dirname, 'make-entry-module.js')], {
      stdio: 'inherit',
    });
    break;
}

function _spawnSubprocess(...args) {
  let result = spawnSync(...args);

  if (result.signal) {
    process.kill(process.pid, result.signal);
  }

  if (result.status) {
    process.exit(result.status);
  }
}
