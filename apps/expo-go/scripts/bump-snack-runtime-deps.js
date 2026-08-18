#!/usr/bin/env node

/**
 * Updates dependency versions in the snack runtime's package.json to match
 * the versions specified in bundledNativeModules.json and the expo package version.
 *
 * Usage:
 *   node scripts/bump-snack-runtime-deps.js ~/code/snack/runtime
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { checkSnackRuntimeDeps } = require('./snackRuntimeDepsUtils');

function main() {
  const runtimeDir = process.argv[2];

  if (!runtimeDir) {
    console.error('Usage: node bump-snack-runtime-deps.js <snack-runtime-path>');
    process.exit(1);
  }

  const { mismatches } = checkSnackRuntimeDeps(runtimeDir);

  if (mismatches.length === 0) {
    console.log('All versions already match. Nothing to update.');
    return;
  }

  const resolvedDir = path.resolve(runtimeDir);
  const runtimePkgPath = path.join(resolvedDir, 'package.json');
  const runtimePkgRaw = fs.readFileSync(runtimePkgPath, 'utf8');
  const runtimePkg = JSON.parse(runtimePkgRaw);
  const runtimeDeps = runtimePkg.dependencies;

  for (const { pkg, bundled } of mismatches) {
    runtimeDeps[pkg] = bundled;
  }

  // Preserve original formatting (detect indent)
  const indent = runtimePkgRaw.match(/^(\s+)"/m)?.[1] || '  ';
  fs.writeFileSync(runtimePkgPath, JSON.stringify(runtimePkg, null, indent) + '\n');

  console.log(`Updated ${mismatches.length} dependencies:\n`);

  const pkgWidth = Math.max(...mismatches.map((m) => m.pkg.length), 'Package'.length);
  const fromWidth = Math.max(...mismatches.map((m) => m.runtime.length), 'From'.length);
  const toWidth = Math.max(...mismatches.map((m) => m.bundled.length), 'To'.length);

  console.log(
    `  ${'Package'.padEnd(pkgWidth)}  ${'From'.padEnd(fromWidth)}  ${'To'.padEnd(toWidth)}`
  );
  console.log(`  ${'-'.repeat(pkgWidth)}  ${'-'.repeat(fromWidth)}  ${'-'.repeat(toWidth)}`);

  for (const { pkg, runtime, bundled } of mismatches) {
    console.log(`  ${pkg.padEnd(pkgWidth)}  ${runtime.padEnd(fromWidth)}  ${bundled.padEnd(toWidth)}`);
  }

  console.log(`\nRunning yarn install in ${resolvedDir}...`);
  execSync('yarn', { cwd: resolvedDir, stdio: 'inherit' });
}

main();
