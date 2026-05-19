const fs = require('fs');
const path = require('path');

const EXPO_PACKAGE_DIR = path.join(__dirname, '../../../packages/expo');
const BUNDLED_NATIVE_MODULES_PATH = path.join(EXPO_PACKAGE_DIR, 'bundledNativeModules.json');
const EXPO_PACKAGE_JSON_PATH = path.join(EXPO_PACKAGE_DIR, 'package.json');

/**
 * Compares dependency versions in a snack runtime package.json against
 * bundledNativeModules.json. Returns { matches, mismatches }.
 */
function checkSnackRuntimeDeps(runtimeDir) {
  const resolvedDir = path.resolve(runtimeDir);
  const runtimePkgPath = path.join(resolvedDir, 'package.json');

  if (!fs.existsSync(runtimePkgPath)) {
    throw new Error(`package.json not found at ${runtimePkgPath}`);
  }

  if (!fs.existsSync(BUNDLED_NATIVE_MODULES_PATH)) {
    throw new Error(`bundledNativeModules.json not found at ${BUNDLED_NATIVE_MODULES_PATH}`);
  }

  const runtimePkg = JSON.parse(fs.readFileSync(runtimePkgPath, 'utf8'));
  const bundledModules = JSON.parse(fs.readFileSync(BUNDLED_NATIVE_MODULES_PATH, 'utf8'));
  const expoPkg = JSON.parse(fs.readFileSync(EXPO_PACKAGE_JSON_PATH, 'utf8'));

  // Include the expo package version itself
  const expectedVersions = { ...bundledModules, expo: expoPkg.version };

  const runtimeDeps = runtimePkg.dependencies || {};

  const mismatches = [];
  const matches = [];

  for (const [pkg, runtimeVersion] of Object.entries(runtimeDeps)) {
    if (!(pkg in expectedVersions)) {
      continue;
    }

    const expectedVersion = expectedVersions[pkg];

    if (runtimeVersion === expectedVersion) {
      matches.push({ pkg, version: runtimeVersion });
    } else {
      mismatches.push({ pkg, runtime: runtimeVersion, bundled: expectedVersion });
    }
  }

  return { matches, mismatches };
}

function formatMismatchTable(mismatches) {
  const pkgWidth = Math.max(...mismatches.map((m) => m.pkg.length), 'Package'.length);
  const runtimeWidth = Math.max(...mismatches.map((m) => m.runtime.length), 'Runtime'.length);
  const bundledWidth = Math.max(...mismatches.map((m) => m.bundled.length), 'Bundled'.length);

  const lines = [];
  lines.push(
    `  ${'Package'.padEnd(pkgWidth)}  ${'Runtime'.padEnd(runtimeWidth)}  ${'Bundled'.padEnd(bundledWidth)}`
  );
  lines.push(`  ${'-'.repeat(pkgWidth)}  ${'-'.repeat(runtimeWidth)}  ${'-'.repeat(bundledWidth)}`);

  for (const { pkg, runtime, bundled } of mismatches) {
    lines.push(
      `  ${pkg.padEnd(pkgWidth)}  ${runtime.padEnd(runtimeWidth)}  ${bundled.padEnd(bundledWidth)}`
    );
  }

  return lines.join('\n');
}

module.exports = { checkSnackRuntimeDeps, formatMismatchTable };
