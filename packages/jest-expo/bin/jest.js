#!/usr/bin/env node
'use strict';

const path = require('node:path');

// This small program is a proxy for the "jest" program defined by the Jest package. The proxy is
// necessary because Jest is not a dependency of the Expo package. Some package managers (e.g., npm)
// don't hoist binaries provided by nested dependencies, so to consistently define a program named
// "jest" we use this proxy script.
//
// We load the Jest binary directly, letting the real "jest" program handle everything else.
const jestPackagePath = path.dirname(require.resolve('jest/package.json'));
const jestPackageJson = require(path.join(jestPackagePath, 'package.json'));
const jestProgramPath = path.resolve(
  jestPackagePath,
  jestPackageJson.bin.jest || jestPackageJson.bin
);

require(jestProgramPath);
