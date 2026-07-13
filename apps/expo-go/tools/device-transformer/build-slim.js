#!/usr/bin/env node
'use strict';
// esbuild driver for the SLIM payload (babel-only). Produces:
//   dist/device-transformer-slim.js      (unminified)
//   dist/device-transformer-slim.min.js  (minified)
//   dist/runner-slim.js
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const EXPO_DIR = process.env.EXPO_DIR || path.resolve(HERE, '../../../..');
if (!fs.existsSync(path.join(EXPO_DIR, 'packages/expo'))) {
  throw new Error(`EXPO_DIR does not look like the expo repo: ${EXPO_DIR}`);
}
// Where the built payload is copied for the app to bundle.
const PAYLOAD_DEST = path.join(
  EXPO_DIR,
  'apps/expo-go/ios/Exponent/DevMenu/ProjectSource/Resources/device-transformer.js'
);

// esbuild isn't a root dependency; find it in the pnpm store
const pnpmDir = path.join(EXPO_DIR, 'node_modules/.pnpm');
const esbuildEntry = fs.readdirSync(pnpmDir)
  .filter((name) => /^esbuild@/.test(name))
  .sort()
  .pop();
if (!esbuildEntry) {
  throw new Error('esbuild not found in node_modules/.pnpm - run pnpm install first');
}
const esbuild = require(path.join(pnpmDir, esbuildEntry, 'node_modules/esbuild'));

const SHIMS = path.join(HERE, 'shims');

const namedShims = {
  fs: 'fs.js',
  path: 'path.js',
  assert: 'assert.js',
  os: 'os.js',
  util: 'util.js',
  url: 'url.js',
  module: 'module.js',
  tty: 'tty.js',
  crypto: 'crypto.js',
  events: 'events.js',
  buffer: 'buffer.js',
  process: 'process.js',
};

const genericBuiltins = new Set([
  'http', 'https', 'http2', 'zlib', 'net', 'tls', 'dns', 'dgram', 'child_process', 'cluster',
  'worker_threads', 'vm', 'v8', 'perf_hooks', 'inspector', 'readline', 'repl', 'string_decoder',
  'stream', 'stream/promises', 'stream/web', 'stream/consumers', 'timers', 'timers/promises',
  'async_hooks', 'querystring', 'punycode', 'domain', 'fs/promises', 'constants', 'sys', 'wasi',
  'trace_events', 'diagnostics_channel', 'readline/promises', 'console',
]);

const shimPlugin = {
  name: 'hermes-shims',
  setup(build) {
    build.onResolve({ filter: /^(node:)?[a-z_0-9]+(\/[a-z_0-9]+)?$/ }, (args) => {
      const bare = args.path.replace(/^node:/, '');
      if (Object.prototype.hasOwnProperty.call(namedShims, bare)) {
        return { path: path.join(SHIMS, namedShims[bare]) };
      }
      if (genericBuiltins.has(bare)) {
        return { path: bare, namespace: 'node-stub' };
      }
      if (bare === 'debug') return { path: path.join(SHIMS, 'debug.js') };
      if (bare === 'lightningcss') return { path: path.join(SHIMS, 'lightningcss.js') };
      return null;
    });
    build.onLoad({ filter: /.*/, namespace: 'node-stub' }, (args) => ({
      contents: `module.exports = globalThis.__nodeBuiltinStub(${JSON.stringify(args.path)});`,
      loader: 'js',
    }));
    // @babel/types' deprecationWarning uses V8's Error.prepareStackTrace /
    // CallSite API (getFileName) to build the message. Hermes's CallSite in
    // babel's deep generator call stack lacks getFileName, so the warning
    // throws and kills the whole transform. The warning is purely advisory
    // (it does not change any validator's result), so stub it to a no-op.
    build.onLoad(
      { filter: /[/\\]@babel[/\\]types[/\\]lib[/\\]utils[/\\]deprecationWarning\.js$/ },
      () => ({
        contents:
          'Object.defineProperty(exports, "__esModule", { value: true });\n' +
          'exports.default = function deprecationWarning() {};\n',
        loader: 'js',
      })
    );
  },
};

// Hermes has no per-iteration binding for `for (const x of …)` — closures
// capture the LAST binding, not a fresh one per iteration (a known Hermes gap;
// RN normally relies on Metro/babel to downlevel this before Hermes sees it).
// babel generates every `NodePath.prototype.is*` method in exactly that shape,
// so under Hermes they all call the last type's validator → isProgram/
// isBlockParent return false → every transform throws in getBlockParent. Run
// the esbuild output through @babel/plugin-transform-block-scoping (what Snack
// gets from babel-loader) to convert block-scoped loop bindings to a
// Hermes-safe form.
function resolveInPnpmStore(prefix, subpath) {
  const entry = fs.readdirSync(pnpmDir).filter((n) => n.startsWith(prefix)).sort().pop();
  if (!entry) throw new Error(`${prefix}* not found in node_modules/.pnpm - run pnpm install`);
  return path.join(pnpmDir, entry, 'node_modules', subpath);
}
const babel = require(resolveInPnpmStore('@babel+core@', '@babel/core'));
const blockScopingPlugin = resolveInPnpmStore('@babel+plugin-transform-block-scoping@', '@babel/plugin-transform-block-scoping');

function hermesDownlevel(filePath, minify) {
  const code = fs.readFileSync(filePath, 'utf8');
  const out = babel.transformSync(code, {
    babelrc: false,
    configFile: false,
    sourceType: 'script',
    compact: minify,
    plugins: [blockScopingPlugin],
  });
  fs.writeFileSync(filePath, out.code);
}

async function buildOne(outfile, minify) {
  const outPath = path.join(HERE, 'dist', outfile);
  await esbuild.build({
    entryPoints: [path.join(HERE, 'entry-slim.js')],
    outfile: outPath,
    bundle: true,
    format: 'iife',
    platform: 'node',
    target: ['es2022'],
    minify,
    // Hermes (Expo Go's only engine) can't PARSE dynamic import() — it rejects
    // the whole payload at load even on dead code paths. babel's ESM-config
    // loader has import() calls we never hit (configFile/babelrc are off), so
    // tell esbuild to lower them to the require()-based fallback.
    supported: { 'dynamic-import': false },
    // Preserve function/class names under minification: babel derives plugin
    // keys and caching identities from function names in places.
    keepNames: minify,
    logLevel: 'warning',
    // entry-slim.js requires babel by bare alias so it holds no repo paths;
    // resolve them against EXPO_DIR here.
    alias: {
      'expo-babel-core': path.join(EXPO_DIR, 'packages/@expo/metro-config/build/babel-core.js'),
      'expo-babel-preset': path.join(EXPO_DIR, 'packages/expo/internal/babel-preset.js'),
    },
    plugins: [shimPlugin],
  });
  hermesDownlevel(outPath, minify);
  return fs.statSync(outPath).size;
}

(async () => {
  const plain = await buildOne('device-transformer-slim.js', false);
  const min = await buildOne('device-transformer-slim.min.js', true);

  const srcPath = path.join(EXPO_DIR, 'apps/native-component-list/src/screens/SharingScreen.tsx');
  const source = fs.readFileSync(srcPath, 'utf8');
  const runner = `'use strict';
var __src = ${JSON.stringify(source)};
try {
  var __res = transformModule(__src, 'src/screens/SharingScreen.tsx', 2369, [559, 2270, 2370, 49, 280, 1779, 229, 2374]);
  print(JSON.stringify({ codeLength: __res.code.length, depNames: __res.depNames }));
  print(__res.code);
} catch (err) {
  print('TRANSFORM_ERROR: ' + String(err) + ' code=' + (err && err.code) + '\\n' + ((err && err.stack) || ''));
}
`;
  fs.writeFileSync(path.join(HERE, 'dist', 'runner-slim.js'), runner);
  // Copy the minified payload into the app bundle (the one the app loads).
  fs.copyFileSync(path.join(HERE, 'dist', 'device-transformer-slim.min.js'), PAYLOAD_DEST);
  console.log('slim bundle: ' + plain + ' bytes (' + (plain / 1024 / 1024).toFixed(2) + ' MB)');
  console.log('slim minified: ' + min + ' bytes (' + (min / 1024 / 1024).toFixed(2) + ' MB)');
  console.log('payload copied to: ' + PAYLOAD_DEST);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
