#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const path = require('path');
const process = require('process');

// This small program is a proxy for the "jest" program defined by the Jest package. The proxy is
// necessary because Jest is not a dependency of the Expo package. Some package managers (e.g., npm)
// don't hoist binaries provided by nested dependencies, so to consistently define a program named
// "jest" we use this proxy script.
//
// We forward all arguments and stdio streams to the real "jest" program and exit with the same
// signal or status code.
//
// If you need to run Jest with the JS debugger enabled, run Jest directly. It is usually under
// node_modules/jest/bin/jest.js.
const jestPackageJson = require('jest/package.json');
const jestPackagePath = path.resolve(require.resolve('jest/package.json'), '..');
const jestProgramPath = path.resolve(jestPackagePath, jestPackageJson.bin.jest);
const jestProgramArgs = process.argv.slice(2);
const jestWithArgs = [jestProgramPath].concat(jestProgramArgs);
const result = childProcess.spawnSync('node', jestWithArgs, { stdio: 'inherit' });

if (result.signal) {
  process.kill(process.pid, result.signal);
} else {
  process.exit(result.status);
}
