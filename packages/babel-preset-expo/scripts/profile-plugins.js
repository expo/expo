#!/usr/bin/env node
/**
 * Profile the cost of each Babel plugin in babel-preset-expo.
 *
 * Usage:
 *   node scripts/profile-plugins.js [--app <path>] [--platform <ios|android|web>] [--json]
 *                                   [--include-node-modules] [--max-files <n>] [--warmup]
 *
 * Defaults:
 *   --app ../../apps/router-e2e
 *   --platform ios
 *
 * This works by:
 * 1. Collecting all .js/.jsx/.ts/.tsx source files from the target app
 * 2. Wrapping the preset to intercept every plugin factory and sub-preset
 * 3. Instrumenting every plugin visitor method with high-resolution timing
 * 4. Calling babel.transformSync per file (same as Metro), so the caller
 *    propagates correctly and plugins see the real source code
 * 5. Reporting a sorted table of plugin costs
 */

const path = require('node:path');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const babel = require('@babel/core');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function flag(name, fallback) {
  const idx = args.indexOf('--' + name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

const appRoot = path.resolve(flag('app', path.join(__dirname, '..', '..', '..', 'apps', 'router-e2e')));
const platform = flag('platform', 'ios');
const jsonOutput = args.includes('--json');
const includeNodeModules = args.includes('--include-node-modules');
const maxFiles = parseInt(flag('max-files', '0'), 10) || Infinity;
const warmup = args.includes('--warmup');

if (!fs.existsSync(appRoot)) {
  console.error(`App root not found: ${appRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Collect source files
// ---------------------------------------------------------------------------

const SOURCE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set([
  '__tests__', '__mocks__', '__fixtures__', '.git', '.expo', 'android', 'ios', 'dist',
]);

function collectFiles(dir, files = [], insideNodeModules = false) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const name = entry.name;
    if (IGNORE_DIRS.has(name)) continue;

    if (name === 'node_modules') {
      if (!includeNodeModules) continue;
      if (insideNodeModules) continue;
      collectFiles(path.join(dir, name), files, true);
      continue;
    }

    const fullPath = path.join(dir, name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files, insideNodeModules);
    } else if (entry.isFile() && SOURCE_EXTS.has(path.extname(name))) {
      files.push(fullPath);
    }
  }
  return files;
}

console.error(`Collecting source files from ${appRoot}...`);

const searchRoots = [appRoot];
if (includeNodeModules) {
  let dir = appRoot;
  while (dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
    const nm = path.join(dir, 'node_modules');
    if (fs.existsSync(nm) && dir !== appRoot) {
      searchRoots.push(nm);
      console.error(`Also scanning monorepo node_modules: ${nm}`);
      break;
    }
  }
}

let files = [];
for (const root of searchRoots) {
  collectFiles(root, files, root !== appRoot);
}
if (files.length > maxFiles) {
  files = files.slice(0, maxFiles);
}
console.error(`Found ${files.length} source files`);

if (files.length === 0) {
  console.error('No source files found. Check the --app path.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Timing infrastructure
// ---------------------------------------------------------------------------

let currentFile = null;

// Map: pluginName -> { totalMs, callCount, files: Set }
const timings = new Map();

function ensureEntry(key) {
  if (!timings.has(key)) {
    timings.set(key, { totalMs: 0, callCount: 0, files: new Set() });
  }
  return timings.get(key);
}

function wrapFn(fn, pluginName) {
  const wrapped = function (...args) {
    const entry = ensureEntry(pluginName);
    const start = performance.now();
    try {
      return fn.apply(this, args);
    } finally {
      entry.totalMs += performance.now() - start;
      entry.callCount++;
      if (currentFile) entry.files.add(currentFile);
    }
  };
  Object.defineProperty(wrapped, 'name', { value: fn.name || pluginName });
  // Preserve .length for Babel's arity checks
  Object.defineProperty(wrapped, 'length', { value: fn.length });
  return wrapped;
}

function wrapVisitor(visitor, pluginName) {
  if (!visitor || typeof visitor !== 'object') return visitor;

  const wrapped = {};
  for (const [nodeType, handler] of Object.entries(visitor)) {
    if (typeof handler === 'function') {
      wrapped[nodeType] = wrapFn(handler, pluginName);
    } else if (handler && typeof handler === 'object') {
      wrapped[nodeType] = { ...handler };
      if (typeof handler.enter === 'function') {
        wrapped[nodeType].enter = wrapFn(handler.enter, pluginName);
      }
      if (typeof handler.exit === 'function') {
        wrapped[nodeType].exit = wrapFn(handler.exit, pluginName);
      }
    } else {
      wrapped[nodeType] = handler;
    }
  }
  return wrapped;
}

// ---------------------------------------------------------------------------
// Plugin/Preset instrumentation
// ---------------------------------------------------------------------------

// Instrument a plugin object (the result of calling a plugin factory).
// This is {name?, visitor?, pre?, post?, ...}
function instrumentPluginObj(pluginObj, pluginName) {
  if (!pluginObj || typeof pluginObj !== 'object') return pluginObj;
  const name = pluginName || pluginObj.name || 'unknown';

  if (pluginObj.visitor) {
    pluginObj.visitor = wrapVisitor(pluginObj.visitor, name);
  }
  if (typeof pluginObj.pre === 'function') {
    pluginObj.pre = wrapFn(pluginObj.pre, name);
  }
  if (typeof pluginObj.post === 'function') {
    pluginObj.post = wrapFn(pluginObj.post, name);
  }
  return pluginObj;
}

// Wrap a plugin factory function so that when Babel calls it, we instrument
// the returned plugin object.
function wrapPluginFactory(factory, pluginName) {
  const wrapped = function (api, options, dirname) {
    const pluginObj = factory.call(this, api, options, dirname);
    return instrumentPluginObj(pluginObj, pluginName || pluginObj?.name);
  };
  Object.defineProperty(wrapped, 'name', { value: factory.name });
  Object.defineProperty(wrapped, 'length', { value: factory.length });
  return wrapped;
}

// Instrument a plugin item as it appears in the preset's returned config.
// Plugin items can be:
//   - A factory function: (api, opts) => ({visitor, ...})
//   - A module object: { default: factoryFn, ...otherExports }
//   - An array: [factoryOrModule, options] or [factoryOrModule, options, name]
//   - A plugin-result object: { visitor, pre, post, ... } (rare, but expo plugins do this)
function instrumentPluginItem(item) {
  if (item == null || item === false) return item;

  if (Array.isArray(item)) {
    const [first, ...rest] = item;
    return [instrumentPluginItem(first), ...rest];
  }

  if (typeof item === 'function') {
    // Direct plugin factory function
    return wrapPluginFactory(item, item.name || undefined);
  }

  if (typeof item === 'object') {
    // Could be a module with .default, or a direct plugin-result object
    if (typeof item.default === 'function') {
      // Module object — mutate in place to preserve __esModule and other
      // non-enumerable properties that Babel relies on for module detection
      item.default = wrapPluginFactory(item.default, item.default.name || undefined);
      return item;
    }
    if (item.visitor || item.pre || item.post) {
      // Direct plugin-result object — instrument it in place
      return instrumentPluginObj({ ...item }, item.name || undefined);
    }
    // Unknown object shape — pass through
    return item;
  }

  return item;
}

// Instrument all plugins inside a preset config object.
// A preset config is { presets?, plugins?, overrides?, ... }
function instrumentPresetConfig(config) {
  if (!config || typeof config !== 'object') return config;

  if (Array.isArray(config.plugins)) {
    config.plugins = config.plugins.map(instrumentPluginItem);
  }

  if (Array.isArray(config.presets)) {
    config.presets = config.presets.map(instrumentPresetItem);
  }

  if (Array.isArray(config.overrides)) {
    config.overrides = config.overrides.map((override) => {
      if (Array.isArray(override.plugins)) {
        override = { ...override, plugins: override.plugins.map(instrumentPluginItem) };
      }
      return override;
    });
  }

  return config;
}

// Instrument a preset item as it appears in a config's presets array.
// Preset items can be:
//   - A factory function: (api, opts) => config
//   - A module object: { default: factoryFn }
//   - An array: [factoryOrModule, options]
//   - A config object: { plugins, presets, overrides, ... } (already resolved)
function instrumentPresetItem(item) {
  if (item == null) return item;

  if (Array.isArray(item)) {
    const [first, ...rest] = item;
    return [instrumentPresetItem(first), ...rest];
  }

  if (typeof item === 'function') {
    return wrapPresetFactory(item);
  }

  if (typeof item === 'object') {
    if (typeof item.default === 'function') {
      // Module object — mutate in place to preserve __esModule and other
      // non-enumerable properties that Babel relies on for module detection
      item.default = wrapPresetFactory(item.default);
      return item;
    }
    // Already a config object (e.g., from @react-native/babel-preset's getPreset())
    if (item.plugins || item.presets || item.overrides) {
      return instrumentPresetConfig({ ...item });
    }
    return item;
  }

  return item;
}

function wrapPresetFactory(factory) {
  const wrapped = function (api, options) {
    const config = factory.call(this, api, options);
    return instrumentPresetConfig(config);
  };
  Object.defineProperty(wrapped, 'name', { value: factory.name });
  Object.defineProperty(wrapped, 'length', { value: factory.length });
  return wrapped;
}

// ---------------------------------------------------------------------------
// Create the instrumented preset
// ---------------------------------------------------------------------------

const originalPreset = require('../build/index.js');

// Wrap the top-level preset
const instrumentedPreset = wrapPresetFactory(originalPreset);

// ---------------------------------------------------------------------------
// Build the Babel options (same pattern as unit tests)
// ---------------------------------------------------------------------------

const caller = {
  name: 'metro',
  bundler: 'metro',
  platform,
  engine: 'hermes',
  isDev: true,
  isServer: false,
  isReactServer: false,
  isNodeModule: false,
  isHMREnabled: true,
  supportsStaticESM: true,
  projectRoot: appRoot,
  routerRoot: './app',
};

const babelOptions = {
  babelrc: false,
  configFile: false,
  presets: [instrumentedPreset],
  caller,
  compact: false,
  comments: true,
  retainLines: false,
};

// Do a dry-run to print resolved plugins
{
  const dryOpts = babel.loadOptions({
    ...babelOptions,
    filename: path.join(appRoot, 'app', 'index.tsx'),
  });
  console.error(`\nResolved ${dryOpts.plugins.length} plugins:`);
  for (const p of dryOpts.plugins) {
    console.error(`  ${p.key}`);
  }
}

// ---------------------------------------------------------------------------
// Transform all files
// ---------------------------------------------------------------------------

console.error(`\nTransforming ${files.length} files (platform=${platform}, dev=true)...\n`);

const fileTimings = [];
let totalTransformMs = 0;
let processed = 0;
let skipped = 0;
let errored = 0;

if (warmup) {
  console.error('Warming up...');
  for (const file of files.slice(0, Math.min(20, files.length))) {
    try {
      babel.transformSync(fs.readFileSync(file, 'utf8'), { ...babelOptions, filename: file });
    } catch {}
  }
  timings.clear();
  console.error('Warmup complete.\n');
}

for (const file of files) {
  let code;
  try {
    code = fs.readFileSync(file, 'utf8');
  } catch {
    skipped++;
    continue;
  }

  if (code.length > 500_000) {
    skipped++;
    continue;
  }

  currentFile = file;
  const fileStart = performance.now();
  try {
    babel.transformSync(code, { ...babelOptions, filename: file });
    const durationMs = performance.now() - fileStart;
    totalTransformMs += durationMs;
    fileTimings.push({ file: path.relative(appRoot, file), durationMs, size: code.length });
    processed++;
  } catch {
    errored++;
  }
  currentFile = null;

  if (!jsonOutput && (processed + errored + skipped) % 500 === 0) {
    process.stderr.write(`\r  ${processed + errored + skipped}/${files.length} files...`);
  }
}
process.stderr.write('\r');

console.error(`Done. Processed: ${processed}, Skipped: ${skipped}, Errored: ${errored}\n`);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const sortedPlugins = [...timings.entries()]
  .map(([key, data]) => ({
    plugin: key,
    totalMs: data.totalMs,
    callCount: data.callCount,
    fileCount: data.files.size,
  }))
  .sort((a, b) => b.totalMs - a.totalMs);

const grandTotalPluginMs = sortedPlugins.reduce((s, p) => s + p.totalMs, 0);
const overhead = totalTransformMs - grandTotalPluginMs;

if (jsonOutput) {
  console.log(JSON.stringify({
    config: { appRoot, platform, filesProcessed: processed, filesSkipped: skipped, filesErrored: errored },
    totalTransformMs,
    totalPluginMs: grandTotalPluginMs,
    overheadMs: overhead,
    plugins: sortedPlugins,
    slowestFiles: fileTimings.sort((a, b) => b.durationMs - a.durationMs).slice(0, 20),
  }, null, 2));
  process.exit(0);
}

// Human-readable report
const W = 110;
console.log('='.repeat(W));
console.log('BABEL PLUGIN PROFILING REPORT');
console.log(`App: ${appRoot}`);
console.log(`Platform: ${platform} | Dev: true | Engine: hermes | Files: ${processed}`);
console.log(`Total transform time:       ${totalTransformMs.toFixed(1)}ms`);
console.log(`  Plugin visitor/hook time:  ${grandTotalPluginMs.toFixed(1)}ms (${((grandTotalPluginMs / totalTransformMs) * 100).toFixed(1)}%)`);
console.log(`  Overhead (parse/traverse): ${overhead.toFixed(1)}ms (${((overhead / totalTransformMs) * 100).toFixed(1)}%)`);
console.log('='.repeat(W));
console.log('');

console.log('PLUGIN TIMINGS (sorted by total time):');
console.log('-'.repeat(W));
console.log(
  'Plugin'.padEnd(58) +
  'Total (ms)'.padStart(12) +
  '% total'.padStart(9) +
  '% xform'.padStart(9) +
  'Calls'.padStart(10) +
  'Files'.padStart(8)
);
console.log('-'.repeat(W));

for (const p of sortedPlugins) {
  const pctPlugin = grandTotalPluginMs > 0 ? ((p.totalMs / grandTotalPluginMs) * 100) : 0;
  const pctTransform = totalTransformMs > 0 ? ((p.totalMs / totalTransformMs) * 100) : 0;
  console.log(
    p.plugin.substring(0, 57).padEnd(58) +
    p.totalMs.toFixed(1).padStart(12) +
    (pctPlugin.toFixed(1) + '%').padStart(9) +
    (pctTransform.toFixed(1) + '%').padStart(9) +
    p.callCount.toString().padStart(10) +
    p.fileCount.toString().padStart(8)
  );
}

console.log('-'.repeat(W));
console.log(
  'TOTAL (plugin time)'.padEnd(58) +
  grandTotalPluginMs.toFixed(1).padStart(12) +
  '100.0%'.padStart(9) +
  (((grandTotalPluginMs / totalTransformMs) * 100).toFixed(1) + '%').padStart(9)
);
console.log(
  'Overhead (parse + traverse + codegen)'.padEnd(58) +
  overhead.toFixed(1).padStart(12) +
  ''.padStart(9) +
  (((overhead / totalTransformMs) * 100).toFixed(1) + '%').padStart(9)
);
console.log(
  'TOTAL (transform time)'.padEnd(58) +
  totalTransformMs.toFixed(1).padStart(12) +
  ''.padStart(9) +
  '100.0%'.padStart(9)
);
console.log('');

// Slowest files
const slowFiles = fileTimings.sort((a, b) => b.durationMs - a.durationMs).slice(0, 15);
if (slowFiles.length > 0) {
  console.log('SLOWEST FILES:');
  console.log('-'.repeat(W));
  console.log('File'.padEnd(80) + 'Time (ms)'.padStart(12) + 'Size (B)'.padStart(12));
  console.log('-'.repeat(W));
  for (const f of slowFiles) {
    console.log(
      f.file.substring(0, 79).padEnd(80) +
      f.durationMs.toFixed(1).padStart(12) +
      f.size.toString().padStart(12)
    );
  }
  console.log('');
}
