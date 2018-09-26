#!/usr/bin/env node
'use strict';

const child_process = require('child_process');
const minimist = require('minimist');
const process = require('process');
const path = require('path');

let argv = minimist(process.argv.slice(2));
switch (argv._[0]) {
  case 'check-workspace-dependencies':
    child_process.execFileSync(path.join(__dirname, 'check-workspace-dependencies.js'), {
      stdio: 'inherit',
    });
    break;

  case 'postinstall':
    child_process.execFileSync(path.join(__dirname, 'symlink-necessary-packages.js'), {
      stdio: 'inherit',
    });
    child_process.execFileSync(path.join(__dirname, 'make-entry-module.js'), {
      stdio: 'inherit',
    });
    break;
}
