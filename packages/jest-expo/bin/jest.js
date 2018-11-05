#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const path = require('path');
const process = require('process');

// This small program is a proxy for the "jest" program defined by the Jest package. We forward all
// arguments and stdio streams to the real "jest" program and exit with the same signal or status
// code.
const jestPackageJson = require('jest/package.json');
const jestPackagePath = path.resolve(require.resolve('jest/package.json'), '..');
const jestProgramPath = path.resolve(jestPackagePath, jestPackageJson.bin.jest);
const jestProgramArgs = process.argv.slice(2);
const result = childProcess.spawnSync(jestProgramPath, jestProgramArgs, { stdio: 'inherit' });

if (result.signal) {
  process.kill(process.pid, result.signal);
} else {
  process.exit(result.status);
}
