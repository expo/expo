/**
 * I/O adapters: shell out to the `expo-modules-autolinking` CLI (module
 * resolution + provider generation) and to `swift package dump-package`.
 * RN invokes the plugin SYNCHRONOUSLY, so everything here is `execFileSync`.
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_BUFFER = 64 * 1024 * 1024;

/** Locate the expo-modules-autolinking CLI (expo depends on it). */
function resolveAutolinkingBin() {
  return require.resolve('expo-modules-autolinking/bin/expo-modules-autolinking.js', {
    paths: [__dirname],
  });
}

/** `expo-modules-autolinking resolve --platform apple --json` from the app root. */
function resolveExpoModules(appRoot) {
  const bin = resolveAutolinkingBin();
  const stdout = execFileSync(process.execPath, [bin, 'resolve', '--platform', 'apple', '--json'], {
    cwd: appRoot,
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
  });
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed : (parsed.modules ?? []);
}

/**
 * Generate ExpoModulesProvider.swift (the module registry) via the autolinking CLI.
 * Returns its absolute path for `generatedSources`, or null if generation produced nothing.
 * `generate-modules-provider` filters to an explicit allowlist (`--packages`); without it the
 * provider is empty, so pass every resolved module's package name.
 */
function generateModulesProvider(appRoot, outDir, moduleNames) {
  const bin = resolveAutolinkingBin();
  const target = path.join(outDir, 'ExpoModulesProvider.swift');
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync(
    process.execPath,
    [
      bin,
      'generate-modules-provider',
      '--target',
      target,
      '--app-root',
      appRoot,
      '--platform',
      'apple',
      '--packages',
      ...moduleNames,
    ],
    { cwd: appRoot, encoding: 'utf8', maxBuffer: MAX_BUFFER }
  );
  return fs.existsSync(target) ? target : null;
}

/** Raw `swift package dump-package` JSON for a module (parse it with parseDumpedManifest). */
function runDumpPackage(moduleRoot) {
  // Inside an Xcode build phase, SDKROOT points at the iOS/tvOS SDK, which
  // breaks `swift package` manifest compilation (it targets macOS but inherits
  // the iOS sysroot: "unable to load standard library for target
  // 'arm64-apple-macosx'"). Drop it so swiftpm picks the macOS SDK itself.
  const { SDKROOT: _sdkroot, ...env } = process.env;
  return execFileSync('swift', ['package', '--package-path', moduleRoot, 'dump-package'], {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    env,
  });
}

module.exports = {
  resolveAutolinkingBin,
  resolveExpoModules,
  generateModulesProvider,
  runDumpPackage,
};
