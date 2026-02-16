#!/usr/bin/env node

/**
 * Checks that dependency versions in the snack runtime's package.json match
 * the versions specified in bundledNativeModules.json.
 *
 * Usage:
 *   node scripts/check-snack-runtime-deps.js ~/code/snack/runtime
 */

const { checkSnackRuntimeDeps } = require('./snackRuntimeDepsUtils');

function main() {
  const runtimeDir = process.argv[2];

  if (!runtimeDir) {
    console.error('Usage: node check-snack-runtime-deps.js <snack-runtime-path>');
    process.exit(1);
  }

  const { matches, mismatches } = checkSnackRuntimeDeps(runtimeDir);

  console.log(`Checked ${matches.length + mismatches.length} shared dependencies\n`);

  if (mismatches.length === 0) {
    console.log('All versions match.');
    return;
  }

  console.log(`Found ${mismatches.length} version mismatch(es):\n`);
  printMismatchTable(mismatches);
  console.log('');
  process.exit(1);
}

function printMismatchTable(mismatches) {
  const pkgWidth = Math.max(...mismatches.map((m) => m.pkg.length), 'Package'.length);
  const runtimeWidth = Math.max(...mismatches.map((m) => m.runtime.length), 'Runtime'.length);
  const bundledWidth = Math.max(...mismatches.map((m) => m.bundled.length), 'Bundled'.length);

  console.log(
    `  ${'Package'.padEnd(pkgWidth)}  ${'Runtime'.padEnd(runtimeWidth)}  ${'Bundled'.padEnd(bundledWidth)}`
  );
  console.log(`  ${'-'.repeat(pkgWidth)}  ${'-'.repeat(runtimeWidth)}  ${'-'.repeat(bundledWidth)}`);

  for (const { pkg, runtime, bundled } of mismatches) {
    console.log(
      `  ${pkg.padEnd(pkgWidth)}  ${runtime.padEnd(runtimeWidth)}  ${bundled.padEnd(bundledWidth)}`
    );
  }
}

main();
