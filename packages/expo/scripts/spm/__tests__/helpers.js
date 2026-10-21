'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

/** A podspec with the given body lines. */
const spec = (...body) => ['Pod::Spec.new do |s|', ...body, 'end', ''].join('\n');

/** A prebuilt-metadata entry: the package root and product name, plus any optional fields. */
const metadataEntry = (packageRoot, productName, fields = {}) => ({
  packageRoot,
  productName,
  ...fields,
});

const tempDirs = [];

/** A new directory under the OS temp dir, removed by `removeTempDirs`. */
function makeTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/** Removes every directory `makeTempDir` created. */
function removeTempDirs() {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Silences console.error, console.warn and console.log for the enclosing describe
 * and records the calls, on spies the returned object holds by method name. With
 * `each`, the spies are replaced for every test instead of once.
 */
function captureConsole({ each = false } = {}) {
  const logs = {};
  (each ? beforeEach : beforeAll)(() => {
    for (const method of ['error', 'warn', 'log']) {
      logs[method] = jest.spyOn(console, method).mockImplementation(() => {});
    }
  });
  (each ? afterEach : afterAll)(() => Object.values(logs).forEach((spy) => spy.mockRestore()));
  return logs;
}

/** Everything a console spy printed, one call per line. */
const printed = (spy) => spy.mock.calls.map(([text]) => text).join('\n');

/**
 * Runs the plugin the way React Native does, for an app at `<tmp>/app` that
 * generates into `<tmp>/out`. `context` adds to or overrides those fields.
 */
function runPlugin(tmp, context = {}) {
  // Required on first use: this Jest config has no transform to hoist a test
  // file's jest.mock calls, so the plugin must load after they have run.
  const expoSpmPlugin = require('../plugin');
  return expoSpmPlugin({
    react: null,
    outputDir: path.join(tmp, 'out'),
    appRoot: path.join(tmp, 'app', 'ios'),
    projectRoot: path.join(tmp, 'app'),
    ...context,
  });
}

/** The error `fn` throws, or null when it returns. */
function thrownBy(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

module.exports = {
  captureConsole,
  makeTempDir,
  metadataEntry,
  printed,
  removeTempDirs,
  runPlugin,
  spec,
  thrownBy,
};
