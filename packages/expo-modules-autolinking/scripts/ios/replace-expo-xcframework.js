#!/usr/bin/env node
/**
 * Replace Expo XCFramework for Debug/Release Configuration
 *
 * This script manages symlinks between debug and release XCFrameworks based on the
 * current Xcode build configuration. It's invoked from a CocoaPods script_phase
 * before each compile to ensure the correct XCFramework variant is linked.
 *
 * Usage:
 *   node replace-expo-xcframework.js -c <CONFIG> -m <MODULE_NAME> -x <XCFRAMEWORKS_PATH>
 *
 * Arguments:
 *   -c, --config       Build configuration: "Debug" or "Release"
 *   -m, --module       Module/product name (e.g., "ExpoModulesCore")
 *   -x, --xcframeworks Path to the .xcframeworks directory
 *
 * The script:
 *   1. Checks if the current/ symlink exists; creates it if not
 *   2. Reads .last_build_configuration to check if switch is needed
 *   3. Updates symlink to point to <config>/<ModuleName>.xcframework
 *   4. Writes new config to .last_build_configuration
 *
 * Based on React Native's replace-rncore-version.js pattern.
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    config: null,
    module: null,
    xcframeworksPath: null,
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
        result.xcframeworksPath = args[++i];
        break;
    }
  }

  return result;
}

function main() {
  const args = parseArgs();

  // Validate arguments
  if (!args.config || !args.module || !args.xcframeworksPath) {
    console.error(
      'Usage: replace-expo-xcframework.js -c <CONFIG> -m <MODULE_NAME> -x <XCFRAMEWORKS_PATH>'
    );
    console.error('  -c, --config       Build configuration: "Debug" or "Release"');
    console.error('  -m, --module       Module/product name');
    console.error('  -x, --xcframeworks Path to the .xcframeworks directory');
    process.exit(1);
  }

  // Normalize config to lowercase for directory names
  const configLower = args.config.toLowerCase();
  if (configLower !== 'debug' && configLower !== 'release') {
    console.error(
      `[Expo XCFramework] Invalid configuration: ${args.config}. Must be "Debug" or "Release".`
    );
    process.exit(1);
  }

  const xcframeworksDir = args.xcframeworksPath;
  const moduleName = args.module;
  const xcframeworkName = `${moduleName}.xcframework`;

  // Paths
  const currentDir = path.join(xcframeworksDir, 'current');
  const currentSymlink = path.join(currentDir, xcframeworkName);
  const targetPath = path.join(xcframeworksDir, configLower, xcframeworkName);
  const lastConfigFile = path.join(xcframeworksDir, '.last_build_configuration');

  // Check if target xcframework exists
  if (!fs.existsSync(targetPath)) {
    console.log(
      `[Expo XCFramework] ${moduleName}: Target xcframework not found at ${targetPath}, skipping.`
    );
    return;
  }

  // Ensure current/ directory exists
  if (!fs.existsSync(currentDir)) {
    fs.mkdirSync(currentDir, { recursive: true });
    console.log(`[Expo XCFramework] ${moduleName}: Created current/ directory.`);
  }

  // Read last build configuration
  let lastConfig = null;
  if (fs.existsSync(lastConfigFile)) {
    try {
      lastConfig = fs.readFileSync(lastConfigFile, 'utf8').trim();
    } catch (e) {
      // Ignore read errors
    }
  }

  // Check if symlink already exists and points to the correct target
  let needsUpdate = true;
  if (fs.existsSync(currentSymlink) || fs.lstatSync(currentSymlink).isSymbolicLink()) {
    try {
      const existingTarget = fs.readlinkSync(currentSymlink);
      const expectedRelativePath = path.join('..', configLower, xcframeworkName);

      if (existingTarget === expectedRelativePath && lastConfig === configLower) {
        console.log(
          `[Expo XCFramework] ${moduleName}: Already pointing to ${configLower}, skipping.`
        );
        needsUpdate = false;
      }
    } catch (e) {
      // Symlink doesn't exist or is broken, needs update
    }
  }

  if (needsUpdate) {
    // Remove existing symlink if present
    try {
      if (fs.existsSync(currentSymlink) || fs.lstatSync(currentSymlink).isSymbolicLink()) {
        fs.unlinkSync(currentSymlink);
      }
    } catch (e) {
      // Ignore errors when removing non-existent symlink
    }

    // Create new symlink (relative path for portability)
    const relativeTarget = path.join('..', configLower, xcframeworkName);
    fs.symlinkSync(relativeTarget, currentSymlink);

    // Write last build configuration
    fs.writeFileSync(lastConfigFile, configLower);

    if (lastConfig && lastConfig !== configLower) {
      console.log(
        `[Expo XCFramework] ${moduleName}: Switched from ${lastConfig} to ${configLower}.`
      );
    } else {
      console.log(`[Expo XCFramework] ${moduleName}: Created symlink pointing to ${configLower}.`);
    }
  }
}

// Handle the case where symlink check throws because path doesn't exist
function safeSymlinkCheck(symlinkPath) {
  try {
    return fs.lstatSync(symlinkPath).isSymbolicLink();
  } catch (e) {
    return false;
  }
}

// Re-implement main with safer checks
function mainSafe() {
  const args = parseArgs();

  // Validate arguments
  if (!args.config || !args.module || !args.xcframeworksPath) {
    console.error(
      'Usage: replace-expo-xcframework.js -c <CONFIG> -m <MODULE_NAME> -x <XCFRAMEWORKS_PATH>'
    );
    console.error('  -c, --config       Build configuration: "Debug" or "Release"');
    console.error('  -m, --module       Module/product name');
    console.error('  -x, --xcframeworks Path to the .xcframeworks directory');
    process.exit(1);
  }

  // Normalize config to lowercase for directory names
  const configLower = args.config.toLowerCase();
  if (configLower !== 'debug' && configLower !== 'release') {
    console.error(
      `[Expo XCFramework] Invalid configuration: ${args.config}. Must be "Debug" or "Release".`
    );
    process.exit(1);
  }

  const xcframeworksDir = args.xcframeworksPath;
  const moduleName = args.module;
  const xcframeworkName = `${moduleName}.xcframework`;

  // Paths
  const currentDir = path.join(xcframeworksDir, 'current');
  const currentSymlink = path.join(currentDir, xcframeworkName);
  const targetPath = path.join(xcframeworksDir, configLower, xcframeworkName);
  const lastConfigFile = path.join(xcframeworksDir, '.last_build_configuration');

  // Check if target xcframework exists
  if (!fs.existsSync(targetPath)) {
    console.log(
      `[Expo XCFramework] ${moduleName}: Target xcframework not found at ${targetPath}, skipping.`
    );
    return;
  }

  // Ensure current/ directory exists
  if (!fs.existsSync(currentDir)) {
    fs.mkdirSync(currentDir, { recursive: true });
    console.log(`[Expo XCFramework] ${moduleName}: Created current/ directory.`);
  }

  // Read last build configuration
  let lastConfig = null;
  if (fs.existsSync(lastConfigFile)) {
    try {
      lastConfig = fs.readFileSync(lastConfigFile, 'utf8').trim();
    } catch (e) {
      // Ignore read errors
    }
  }

  // Check if symlink already exists and points to the correct target
  let needsUpdate = true;
  const symlinkExists = safeSymlinkCheck(currentSymlink);

  if (symlinkExists) {
    try {
      const existingTarget = fs.readlinkSync(currentSymlink);
      const expectedRelativePath = path.join('..', configLower, xcframeworkName);

      if (existingTarget === expectedRelativePath && lastConfig === configLower) {
        console.log(
          `[Expo XCFramework] ${moduleName}: Already pointing to ${configLower}, skipping.`
        );
        needsUpdate = false;
      }
    } catch (e) {
      // Symlink is broken, needs update
    }
  }

  if (needsUpdate) {
    // Remove existing symlink if present
    if (symlinkExists) {
      try {
        fs.unlinkSync(currentSymlink);
      } catch (e) {
        // Ignore errors when removing
      }
    }

    // Create new symlink (relative path for portability)
    const relativeTarget = path.join('..', configLower, xcframeworkName);
    fs.symlinkSync(relativeTarget, currentSymlink);

    // Write last build configuration
    fs.writeFileSync(lastConfigFile, configLower);

    if (lastConfig && lastConfig !== configLower) {
      console.log(
        `[Expo XCFramework] ${moduleName}: Switched from ${lastConfig} to ${configLower}.`
      );
    } else {
      console.log(`[Expo XCFramework] ${moduleName}: Created symlink pointing to ${configLower}.`);
    }
  }
}

mainSafe();
