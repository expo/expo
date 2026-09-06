const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const babel = require('@babel/core');

const output = path.join(__dirname, '../ios/Resources/UIReactProof.js');
const bundle = esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'proof.jsx')],
  outfile: output,
  write: false,
  bundle: true,
  format: 'iife',
  platform: 'neutral',
  target: 'es2019',
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: fs.readFileSync(path.join(__dirname, 'environment.js'), 'utf8') },
  legalComments: 'eof',
});
// Lower the WHOLE bundle, including esbuild's generated import helpers. Like
// Expo's Hermes preset, preserve per-iteration bindings using function scopes.
// Lowering only our source would leave broken import getters in the bundle.
const lowered = babel.transformSync(bundle.outputFiles[0].text, {
  configFile: false,
  babelrc: false,
  plugins: [require('@babel/plugin-transform-block-scoping')],
});
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, lowered.code);
console.log('Built standalone React proof for the UI runtime.');
