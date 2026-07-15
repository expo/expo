'use strict';
// Proves the AST-based require extraction ignores a string literal that
// merely CONTAINS `require("…")`, which the old regex wrongly counted.
const path = require('path');
const EXPO_DIR = process.env.EXPO_DIR || path.resolve(__dirname, '../../../..');
const { transformSync } = require(path.join(EXPO_DIR, 'packages/@expo/metro-config/build/babel-core.js'));
const babelPresetExpo = require(path.join(EXPO_DIR, 'packages/expo/internal/babel-preset.js'));
const { collectRequireNames, analyzeRequires } = require('./collect-require-names.js');

const source = [
  "import { View } from 'react-native';",
  "const decoy = 'see require(\"phantom\") in this string';",
  'export const x = View;',
].join('\n');

const { code } = transformSync(source, {
  filename: 'test.tsx',
  presets: [[babelPresetExpo, { enableBabelRuntime: false }]],
  caller: { name: 'metro', platform: 'ios', bundler: 'metro', isDev: false, isServer: false, engine: 'hermes' },
  babelrc: false,
  configFile: false,
  sourceType: 'module',
  compact: true,
});

const astDeps = collectRequireNames(code, transformSync);
const regexDeps = [...new Set([...code.matchAll(/require\((['"])(.*?)\1\)/g)].map((m) => m[2]))];

console.log('AST deps:  ', JSON.stringify(astDeps));
console.log('regex deps:', JSON.stringify(regexDeps));

const expected = ['react-native'];
const ok = astDeps.length === expected.length && expected.every((d, i) => astDeps[i] === d);
if (!ok) {
  console.error('FAIL: expected ' + JSON.stringify(expected) + ' got ' + JSON.stringify(astDeps));
  process.exit(1);
}
if (regexDeps.includes('phantom')) {
  console.log("PASS: AST omits 'phantom'; the regex would have included it");
} else {
  console.log('PASS: AST deps correct (regex did not trip on this input)');
}

// unsupported-construct detection: dynamic import() and require.context must
// be flagged so the applier refuses instead of emitting a broken patch.
function analyze(src) {
  const { code } = transformSync(src, {
    filename: 't.tsx',
    presets: [[babelPresetExpo, { enableBabelRuntime: false }]],
    caller: { name: 'metro', platform: 'ios', bundler: 'metro', isDev: false, isServer: false, engine: 'hermes' },
    babelrc: false, configFile: false, sourceType: 'module', compact: true,
  });
  return analyzeRequires(code, transformSync).unsupported;
}
const dyn = analyze("export const f = () => import('./Heavy');");
const ctx = analyze("export const c = require.context('./x');");
const clean = analyze("import a from 'react'; export default a;");
console.log('dynamic import unsupported:', JSON.stringify(dyn));
console.log('require.context unsupported:', JSON.stringify(ctx));
console.log('clean unsupported:', JSON.stringify(clean));
if (!dyn.some((u) => u.includes('import')) || !ctx.some((u) => u.includes('require.')) || clean.length !== 0) {
  console.error('FAIL: unsupported-construct detection wrong');
  process.exit(1);
}
console.log('PASS: import()/require.context flagged unsupported; clean file not');
