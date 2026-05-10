#!/usr/bin/env node
/**
 * Profile the cost of each Babel plugin in babel-preset-expo.
 *
 * Runs all four config sets (hermes-v1, hermes-v0, web, webview) and compares
 * them against each other, with per-plugin breakdowns for each.
 *
 * Usage:
 *   node scripts/profile-plugins.js [--app <path>] [--config <names>] [--runs <n>] [--json]
 *
 * Defaults:
 *   --app ../../apps/router-e2e
 *   --config hermes-v1,hermes-v0,web,webview  (all)
 *   --runs 5
 *
 * This works by:
 * 1. Collecting all .js/.jsx/.ts/.tsx source files from the target app
 * 2. For each config: wrapping the preset to intercept every plugin factory
 * 3. Instrumenting every plugin visitor method with high-resolution timing
 * 4. Calling babel.transformSync per file (same as Metro), so the caller
 *    propagates correctly and plugins see the real source code
 * 5. Reporting a sorted table of plugin costs per config + a comparison
 */

const path = require('node:path');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const babel = require('@babel/core');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Profile the cost of each Babel plugin in babel-preset-expo.

Usage:
  node scripts/profile-plugins.js [options]

Options:
  --app <path>       App root to profile (default: ../../apps/router-e2e)
  --config <names>   Comma-separated config names to run (default: all)
                     Available: hermes-v1, hermes-v0, web, webview
  --runs <n>         Number of runs per config; first is warmup (default: 5)
  --json             Output results as JSON
  --help             Show this help

Examples:
  node scripts/profile-plugins.js
  node scripts/profile-plugins.js --config hermes-v1
  node scripts/profile-plugins.js --config hermes-v0,web --runs 5
  node scripts/profile-plugins.js --app ../my-app --json`);
  process.exit(0);
}

function flag(name, fallback) {
  const idx = args.indexOf('--' + name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

const appRoot = path.resolve(flag('app', path.join(__dirname, '..', '..', '..', 'apps', 'router-e2e')));
const runs = Math.max(2, parseInt(flag('runs', '5'), 10) || 5);
const jsonOutput = args.includes('--json');

if (!fs.existsSync(appRoot)) {
  console.error(`App root not found: ${appRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Config definitions
// ---------------------------------------------------------------------------

// Each config represents a different babel-preset-expo code path.
// The caller properties determine which config sub-preset is selected
// (see src/index.ts for the selection logic).
const CONFIGS = [
  {
    name: 'hermes-v1',
    description: 'Hermes stable (native, engine=hermes)',
    caller: { platform: 'ios', engine: 'hermes', isDomComponent: false },
  },
  {
    name: 'hermes-v0',
    description: 'Hermes v0 / default (native, no engine)',
    caller: { platform: 'ios', engine: undefined, isDomComponent: false },
  },
  {
    name: 'web',
    description: 'Web (modern engine)',
    caller: { platform: 'web', engine: undefined, isDomComponent: false },
  },
  {
    name: 'webview',
    description: 'Webview / DOM component',
    caller: { platform: 'web', engine: undefined, isDomComponent: true },
  },
];

const configFilter = flag('config', '');
const selectedConfigs = configFilter
  ? CONFIGS.filter((c) => configFilter.split(',').includes(c.name))
  : CONFIGS;

if (selectedConfigs.length === 0) {
  const available = CONFIGS.map((c) => c.name).join(', ');
  console.error(`No matching configs for "${configFilter}". Available: ${available}`);
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
{
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

const files = [];
for (const root of searchRoots) {
  collectFiles(root, files, root !== appRoot);
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
// Flush require cache between configs
// ---------------------------------------------------------------------------

// instrumentPluginItem mutates module objects (item.default = wrapped), so we
// must flush the require cache between config runs to avoid double-wrapping.
const pkgBuildDir = path.join(path.resolve(__dirname, '..'), 'build') + path.sep;

function clearRequireCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(pkgBuildDir)) {
      delete require.cache[key];
    }
  }
}

// ---------------------------------------------------------------------------
// Profile a single config
// ---------------------------------------------------------------------------

function profileConfig(config) {
  clearRequireCache();
  timings.clear();

  const originalPreset = require('../build/index.js');
  const instrumentedPreset = wrapPresetFactory(originalPreset);

  const caller = {
    name: 'metro',
    bundler: 'metro',
    platform: config.caller.platform,
    engine: config.caller.engine,
    isDev: true,
    isServer: false,
    isReactServer: false,
    isNodeModule: false,
    isHMREnabled: true,
    supportsStaticESM: true,
    projectRoot: appRoot,
    routerRoot: './app',
    isDomComponent: config.caller.isDomComponent,
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

  // Dry-run to print resolved plugins
  const dryOpts = babel.loadOptions({
    ...babelOptions,
    filename: path.join(appRoot, 'app', 'index.tsx'),
  });
  console.error(`  Resolved ${dryOpts.plugins.length} plugins`);

  // Pre-read all files once to avoid I/O variance between runs
  const fileContents = [];
  let skipped = 0;
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
    fileContents.push({ file, code });
  }

  // Run the transform loop multiple times; the first run is discarded as warmup
  const runSnapshots = [];

  for (let run = 0; run < runs; run++) {
    timings.clear();
    const fileTimings = [];
    let totalTransformMs = 0;
    let processed = 0;
    let errored = 0;

    for (const { file, code } of fileContents) {
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
    }

    const isWarmup = run === 0;
    if (!isWarmup) {
      runSnapshots.push({
        totalTransformMs,
        processed,
        errored,
        fileTimings,
        pluginSnapshot: [...timings.entries()].map(([key, data]) => ({
          plugin: key,
          totalMs: data.totalMs,
          callCount: data.callCount,
          fileCount: data.files.size,
        })),
      });
    }

    console.error(`    Run ${run + 1}/${runs}: ${totalTransformMs.toFixed(1)}ms${isWarmup ? ' (warmup, discarded)' : ''}`);
  }

  // Average results across measured runs
  const measuredRuns = runSnapshots.length;
  const processed = runSnapshots[0].processed;
  const errored = runSnapshots[0].errored;

  // Average plugin timings
  const pluginTotals = new Map();
  for (const { pluginSnapshot } of runSnapshots) {
    for (const p of pluginSnapshot) {
      if (!pluginTotals.has(p.plugin)) {
        pluginTotals.set(p.plugin, { totalMs: 0, callCount: p.callCount, fileCount: p.fileCount });
      }
      pluginTotals.get(p.plugin).totalMs += p.totalMs;
    }
  }
  const sortedPlugins = [...pluginTotals.entries()]
    .map(([key, data]) => ({
      plugin: key,
      totalMs: data.totalMs / measuredRuns,
      callCount: data.callCount,
      fileCount: data.fileCount,
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  // Average file timings
  const fileTotals = new Map();
  for (const { fileTimings } of runSnapshots) {
    for (const f of fileTimings) {
      if (!fileTotals.has(f.file)) {
        fileTotals.set(f.file, { durationMs: 0, size: f.size });
      }
      fileTotals.get(f.file).durationMs += f.durationMs;
    }
  }
  const fileTimings = [...fileTotals.entries()].map(([file, data]) => ({
    file,
    durationMs: data.durationMs / measuredRuns,
    size: data.size,
  }));

  const totalPluginMs = sortedPlugins.reduce((s, p) => s + p.totalMs, 0);

  console.error(`  Average: ${totalPluginMs.toFixed(1)}ms plugin time (${measuredRuns} measured runs, ${processed} files, ${skipped} skipped, ${errored} errored)`);

  return {
    name: config.name,
    description: config.description,
    totalPluginMs,
    sortedPlugins,
    fileTimings,
    processed,
    skipped,
    errored,
  };
}

// ---------------------------------------------------------------------------
// Run all configs
// ---------------------------------------------------------------------------

const configNames = selectedConfigs.map((c) => c.name).join(', ');
console.error(`\nConfigs: ${configNames}`);
console.error(`Runs per config: ${runs}`);
console.error(`Files: ${files.length}\n`);

const results = [];
for (let i = 0; i < selectedConfigs.length; i++) {
  const config = selectedConfigs[i];
  console.error(`[${i + 1}/${selectedConfigs.length}] ${config.name} — ${config.description}`);
  results.push(profileConfig(config));
  console.error('');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (jsonOutput) {
  console.log(JSON.stringify({
    appRoot,
    runs,
    filesTotal: files.length,
    configs: results.map((r) => ({
      name: r.name,
      description: r.description,
      filesProcessed: r.processed,
      filesSkipped: r.skipped,
      filesErrored: r.errored,
      totalPluginMs: r.totalPluginMs,
      plugins: r.sortedPlugins,
      slowestFiles: r.fileTimings.sort((a, b) => b.durationMs - a.durationMs).slice(0, 20),
    })),
  }, null, 2));
  process.exit(0);
}

// Human-readable report — per-config plugin breakdowns
const W = 110;

for (const r of results) {
  console.log('='.repeat(W));
  console.log(`BABEL PLUGIN PROFILING REPORT — ${r.name}`);
  console.log(`${r.description}`);
  console.log(`App: ${appRoot}`);
  console.log(`Files: ${r.processed} | Runs: ${runs} (first discarded as warmup, ${runs - 1} averaged)`);
  console.log(`Total plugin time: ${r.totalPluginMs.toFixed(1)}ms`);
  console.log('='.repeat(W));
  console.log('');

  console.log('PLUGIN TIMINGS (sorted by total time):');
  console.log('-'.repeat(W));
  console.log(
    'Plugin'.padEnd(58) +
    'Total (ms)'.padStart(12) +
    '%'.padStart(9) +
    'Calls'.padStart(10) +
    'Files'.padStart(8)
  );
  console.log('-'.repeat(W));

  for (const p of r.sortedPlugins) {
    const pct = r.totalPluginMs > 0 ? ((p.totalMs / r.totalPluginMs) * 100) : 0;
    console.log(
      p.plugin.substring(0, 57).padEnd(58) +
      p.totalMs.toFixed(1).padStart(12) +
      (pct.toFixed(1) + '%').padStart(9) +
      p.callCount.toString().padStart(10) +
      p.fileCount.toString().padStart(8)
    );
  }

  console.log('-'.repeat(W));
  console.log(
    'TOTAL'.padEnd(58) +
    r.totalPluginMs.toFixed(1).padStart(12) +
    '100.0%'.padStart(9)
  );
  console.log('');

  // Slowest files
  const slowFiles = r.fileTimings.sort((a, b) => b.durationMs - a.durationMs).slice(0, 15);
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
}

// ---------------------------------------------------------------------------
// Config comparison (only when multiple configs were profiled)
// ---------------------------------------------------------------------------

if (results.length > 1) {
  console.log('='.repeat(W));
  console.log('CONFIG COMPARISON');
  console.log('='.repeat(W));
  console.log('');

  const nameW = 20;
  const compW = nameW + 16 + 8 + 10;
  console.log(
    'Config'.padEnd(nameW) +
    'Plugin (ms)'.padStart(16) +
    'Files'.padStart(8) +
    'Plugins'.padStart(10)
  );
  console.log('-'.repeat(compW));

  for (const r of results) {
    console.log(
      r.name.padEnd(nameW) +
      r.totalPluginMs.toFixed(1).padStart(16) +
      r.processed.toString().padStart(8) +
      r.sortedPlugins.length.toString().padStart(10)
    );
  }

  const fastest = results.reduce((a, b) => a.totalPluginMs < b.totalPluginMs ? a : b);
  console.log('');
  console.log(`Fastest: ${fastest.name} (${fastest.totalPluginMs.toFixed(1)}ms)`);
  for (const r of results) {
    if (r === fastest) continue;
    const diff = r.totalPluginMs - fastest.totalPluginMs;
    const pct = (diff / fastest.totalPluginMs) * 100;
    console.log(`  ${r.name}: +${diff.toFixed(1)}ms (+${pct.toFixed(1)}%)`);
  }
  console.log('');
}
