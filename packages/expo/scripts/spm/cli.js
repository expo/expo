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
 *
 * `--target-name` and `--podfile-properties-file-path` only have an effect together: inline
 * modules are registered by looking the target name up in the properties file.
 */
function generateModulesProvider({
  appRoot,
  outDir,
  moduleNames,
  targetName = null,
  entitlementPath = null,
  podfilePropertiesPath = null,
}) {
  // `--packages` is variadic and the CLI rejects it without a value, so an app that
  // autolinks nothing (everything excluded) must not reach the generator at all.
  if (moduleNames.length === 0) return null;
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
      ...(targetName != null ? ['--target-name', targetName] : []),
      ...(entitlementPath != null ? ['--entitlement', entitlementPath] : []),
      ...(podfilePropertiesPath != null
        ? ['--podfile-properties-file-path', podfilePropertiesPath]
        : []),
      // Variadic: everything after it is read as a package name, so it goes last.
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
