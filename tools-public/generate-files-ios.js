#!/usr/bin/env node

'use strict';

const path = require('path');

const {
  generateDynamicMacrosAsync,
  cleanupDynamicMacrosAsync,
} = require('./generate-dynamic-macros');

const expoKitPath = path.join(__dirname, '..');
const supportingDir = path.join(expoKitPath, 'ios', 'Exponent', 'Supporting');

const run = async () => {
  await generateDynamicMacrosAsync({
    buildConstantsPath: path.join(supportingDir, 'EXBuildConstants.plist'),
    platform: 'ios',
    infoPlistPath: supportingDir,
    expoKitPath: expoKitPath,
    templateFilesPath: path.join(expoKitPath, 'template-files'),
  });
  await cleanupDynamicMacrosAsync({
    platform: 'ios',
    infoPlistPath: supportingDir,
    expoKitPath: expoKitPath,
  });
};

run();
