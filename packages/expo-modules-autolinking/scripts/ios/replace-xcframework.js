#!/usr/bin/env node
/**
 * Replace XCFramework for Debug/Release Configuration
 *
 * This script extracts the correct flavor tarball to switch between debug and release
 * xcframeworks. It's invoked from a CocoaPods script_phase before each compile
 * to ensure the correct XCFramework variant is linked.
 *
 * Directory structure:
 *   <xcframeworks_dir>/
 *     artifacts/
 *       <Product>-debug.tar.gz         (tarball, source of truth)
 *       <Product>-release.tar.gz       (tarball, source of truth)
 *       .last_build_configuration
 *     <Product>.xcframework/           (real dir, extracted from tarball)
 *     <Dependency>.xcframework/        (real dir, if any, extracted from same tarball)
 *
 * Usage:
 *   node replace-xcframework.js -c <CONFIG> -m <MODULE_NAME> -x <XCFRAMEWORKS_DIR>
 *
 * Arguments:
 *   -c, --config  Build configuration: "debug" or "release"
 *   -m, --module  Module/product name (used for tarball lookup and logging)
 *   -x, --xcframeworks  Path to the pod directory (Pods/<PodName>/)
 *
 * The script:
 *   1. Finds the tarball: <xcframeworksDir>/artifacts/<module>-<config>.tar.gz
 *   2. Checks artifacts/.last_build_configuration — skips if unchanged
 *   3. Removes all *.xcframework directories in xcframeworksDir
 *   4. Extracts the tarball: tar -xzf ... -C <xcframeworksDir>
 *   5. Writes the new config to artifacts/.last_build_configuration
 *
 * Based on React Native's replace-rncore-version.js pattern.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const LOG_PREFIX = '[Expo XCFramework]';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    config: null,
    module: null,
    xcframeworksDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-c':
      case '--config':
        result.config = args[++i];
        break;
      case '-m':
      case '--module':
        result.module = args[++i];
        break;
      case '-x':
      case '--xcframeworks':
        result.xcframeworksDir = args[++i];
        break;
    }
  }

  return result;
}

function main() {
  const args = parseArgs();

  // Validate arguments
  if (!args.config || !args.module || !args.xcframeworksDir) {
    console.error(
      'Usage: replace-xcframework.js -c <CONFIG> -m <MODULE_NAME> -x <XCFRAMEWORKS_DIR>'
    );
    console.error('  -c, --config  Build configuration: "debug" or "release"');
    console.error('  -m, --module  Module/product name');
    console.error('  -x, --xcframeworks  Path to the xcframeworks directory');
    process.exit(1);
  }

  // Normalize config to lowercase
  const configLower = args.config.toLowerCase();
  if (configLower !== 'debug' && configLower !== 'release') {
    console.error(
      `${LOG_PREFIX} Invalid configuration: ${args.config}. Must be "debug" or "release".`
    );
    process.exit(1);
  }

  const xcframeworksDir = args.xcframeworksDir;
  const moduleName = args.module;

  // Validate xcframeworksDir exists
  if (!fs.existsSync(xcframeworksDir) || !fs.statSync(xcframeworksDir).isDirectory()) {
    console.error(`${LOG_PREFIX} ${moduleName}: Directory not found: ${xcframeworksDir}`);
    process.exit(1);
  }

  // Ensure artifacts directory exists
  const artifactsDir = path.join(xcframeworksDir, 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });

  // Find the tarball for the requested configuration (stored in artifacts/)
  const tarballPath = path.join(artifactsDir, `${moduleName}-${configLower}.tar.gz`);
  const lastConfigFile = path.join(artifactsDir, '.last_build_configuration');

  // Check if tarball exists
  if (!fs.existsSync(tarballPath)) {
    console.error(
      `${LOG_PREFIX} ${moduleName}: Tarball not found at ${tarballPath}, skipping.`
    );
    return;
  }

  // Read last build configuration
  let lastConfig = null;
  if (fs.existsSync(lastConfigFile)) {
    try {
      lastConfig = fs.readFileSync(lastConfigFile, 'utf8').trim();
    } catch (e) {
      // Ignore read errors — will proceed with extraction
    }
  }

  // Check if configuration has changed
  if (lastConfig === configLower) {
    console.log(`${LOG_PREFIX} ${moduleName}: Already extracted ${configLower}, skipping.`);
    return;
  }

  // Remove all existing *.xcframework directories
  const entries = fs.readdirSync(xcframeworksDir);
  for (const entry of entries) {
    if (!entry.endsWith('.xcframework')) continue;
    const entryPath = path.join(xcframeworksDir, entry);

    try {
      const stat = fs.lstatSync(entryPath);
      if (stat.isDirectory() || stat.isSymbolicLink()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`${LOG_PREFIX} ${moduleName}: Warning: failed to remove ${entry}: ${e.message}`);
    }
  }

  // Extract the tarball using spawnSync to avoid shell interpretation of paths
  const result = spawnSync('tar', ['-xzf', tarballPath, '-C', xcframeworksDir], {
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString().trim() : 'unknown error';
    console.error(`${LOG_PREFIX} ${moduleName}: Failed to extract tarball: ${stderr}`);
    process.exit(1);
  }

  // Write last build configuration
  try {
    fs.writeFileSync(lastConfigFile, configLower);
  } catch (e) {
    console.error(`${LOG_PREFIX} ${moduleName}: Warning: failed to write config file: ${e.message}`);
  }

  if (lastConfig && lastConfig !== configLower) {
    console.log(
      `${LOG_PREFIX} ${moduleName}: Switched from ${lastConfig} to ${configLower} (extracted tarball).`
    );
  } else {
    console.log(`${LOG_PREFIX} ${moduleName}: Extracted ${configLower} tarball.`);
  }
}

main();
