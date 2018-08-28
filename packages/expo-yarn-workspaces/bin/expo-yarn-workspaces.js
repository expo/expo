#!/usr/bin/env node
'use strict';

const child_process = require('child_process');
const path = require('path');

child_process.execFileSync(path.join(__dirname, 'symlink-necessary-packages.js'), {
  stdio: 'inherit'
});
child_process.execFileSync(path.join(__dirname, 'make-entry-module.js'), { stdio: 'inherit' });
