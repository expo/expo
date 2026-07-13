#!/usr/bin/env node
// Node truth for the SLIM payload: plain babel.transformSync with
// babel-preset-expo, no metro worker. Also answers whether skipping the
// worklets/@expo/ui/expo-widgets resolve probes changes the output.
const fs = require('fs');
const path = require('path');
const Module = require('module');

const EXPO_DIR = process.env.EXPO_DIR || path.resolve(__dirname, '../../../..');
const APP_ROOT = path.join(EXPO_DIR, 'apps/native-component-list');
const SRC = path.join(APP_ROOT, 'src/screens/SharingScreen.tsx');
const FILENAME = 'src/screens/SharingScreen.tsx';

const BABEL_CORE = path.join(EXPO_DIR, 'packages/@expo/metro-config/build/babel-core.js');
const BABEL_PRESET = path.join(EXPO_DIR, 'packages/expo/internal/babel-preset.js');
const { transformSync } = require(BABEL_CORE);
const babelPresetExpo = require(BABEL_PRESET);

const OPTIONS = () => ({
  filename: FILENAME,
  presets: [[babelPresetExpo, { enableBabelRuntime: false }]],
  caller: { name: 'metro', platform: 'ios', bundler: 'metro', isDev: false, isServer: false, engine: 'hermes' },
  babelrc: false,
  configFile: false,
  sourceType: 'module',
  compact: true,
});

const { analyzeRequires } = require('./collect-require-names.js');
const extractDeps = (code) => analyzeRequires(code, transformSync).names;

const PROBE_IDS = new Set([
  'react-native-worklets/plugin',
  '@expo/ui/babel-plugin',
  'expo-widgets/package.json',
  'expo-router/package.json',
]);

const source = fs.readFileSync(SRC, 'utf8');

// Pass 1: normal monorepo resolution (matches the validated offline state).
const normal = transformSync(source, OPTIONS());

// Pass 2: force the optional probes to MODULE_NOT_FOUND (what an
// unregistered resolve map would do in Hermes). NOTE: babel-preset-expo caches
// resolve results per projectRoot, so run this in a fresh cache by spawning.
if (process.argv[2] === '--isolated') {
  process.stdout.write(JSON.stringify({ mode: 'isolated-check' }));
  process.exit(0);
}

const { execFileSync } = require('child_process');
const isolatedRunner = `
const Module = require('module');
const orig = Module._resolveFilename;
const PROBE_IDS = new Set(${JSON.stringify([...PROBE_IDS])});
Module._resolveFilename = function (request, parent, isMain, options) {
  if (PROBE_IDS.has(request) && options && options.paths) {
    const e = new Error("Cannot find module '" + request + "'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  }
  return orig.call(this, request, parent, isMain, options);
};
const fs = require('fs');
const { transformSync } = require(${JSON.stringify(BABEL_CORE)});
const babelPresetExpo = require(${JSON.stringify(BABEL_PRESET)});
const source = fs.readFileSync(${JSON.stringify(SRC)}, 'utf8');
const res = transformSync(source, {
  filename: ${JSON.stringify(FILENAME)},
  presets: [[babelPresetExpo, { enableBabelRuntime: false }]],
  caller: { name: 'metro', platform: 'ios', bundler: 'metro', isDev: false, isServer: false, engine: 'hermes' },
  babelrc: false,
  configFile: false,
  sourceType: 'module',
  compact: true,
});
process.stdout.write(res.code);
`;
const isolatedCode = execFileSync(process.execPath, ['-e', isolatedRunner], {
  encoding: 'utf8',
  env: { ...process.env, NODE_ENV: undefined, BABEL_ENV: undefined },
  maxBuffer: 64 * 1024 * 1024,
});

fs.writeFileSync(path.join(__dirname, 'expected-slim-code.js'), normal.code);
console.log('normal codeLength:', normal.code.length);
console.log('isolated codeLength:', isolatedCode.length);
console.log('PROBES ' + (normal.code === isolatedCode ? 'DO NOT AFFECT OUTPUT (safe to skip in Hermes)' : 'CHANGE OUTPUT (must bundle plugins)'));
if (normal.code !== isolatedCode) {
  let i = 0;
  while (i < Math.min(normal.code.length, isolatedCode.length) && normal.code[i] === isolatedCode[i]) i++;
  console.log('first divergence at', i);
  console.log(' normal  :', JSON.stringify(normal.code.slice(Math.max(0, i - 60), i + 80)));
  console.log(' isolated:', JSON.stringify(isolatedCode.slice(Math.max(0, i - 60), i + 80)));
}
console.log('depNames:', JSON.stringify(extractDeps(normal.code)));
