'use strict';
// SLIM Hermes payload: plain babel.transformSync + babel-preset-expo, no Metro
// worker, no minifier, no dependency collection. Exposes:
//   globalThis.transformModule(source, filename, moduleId, depIds)
//     -> { code: string, depNames: string[] }   (synchronous)
require('./globals.js');

// The worklets/@expo/ui/expo-widgets resolve probes stay UNREGISTERED on
// purpose: the global require.resolve shim throws MODULE_NOT_FOUND, which
// babel-preset-expo treats as "module not installed" and skips the plugins.
// Verified in Node (baseline-slim.js) that this does not change the output
// for the validated input.

// Bare aliases resolved by build-slim.js's esbuild config (against EXPO_DIR),
// so this file holds no repo paths.
const { transformSync } = require('expo-babel-core');
const babelPresetExpo = require('expo-babel-preset');
const { analyzeRequires } = require('./collect-require-names.js');

globalThis.transformModule = function transformModule(source, filename, _moduleId, _depIds) {
  const result = transformSync(source, {
    filename,
    presets: [[babelPresetExpo, { enableBabelRuntime: false }]],
    caller: { name: 'metro', platform: 'ios', bundler: 'metro', isDev: false, isServer: false, engine: 'hermes' },
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    compact: true,
  });
  const code = result.code;
  const { names, unsupported } = analyzeRequires(code, transformSync);
  if (unsupported.length) {
    // Refuse rather than emit a patch that would fail to load: the on-device
    // require shim maps require("name") only, and Hermes can't parse import().
    throw new Error('Unsupported for on-device editing: ' + unsupported.join(', ') +
      '. This file uses module features that published projects can\'t re-link on device.');
  }
  return { code, depNames: names };
};
