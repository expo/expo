#!/usr/bin/env node

// Basic node CLI script to resolve the native app entry file.
//
// Usage:
//   node expo/scripts/resolveAppEntry.js path/to/project-root <platform> <format>
//
// Example:
//   node expo/scripts/resolveAppEntry.js path/to/project-root/ android absolute
//
// Returns:
//   The resolved entry file path.
//
// Limitations:
//   Currently only supports android and ios.

const { resolveEntryPoint } = require('@expo/config/paths');
const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[1];
const platform = process.argv[2];
const absolute = process.argv[3] === 'absolute';

if (!platform || !projectRoot) {
  console.error(
    'Usage: node expo/scripts/resolveAppEntry.js <projectRoot> <platform> <relative|absolute>'
  );
  process.exit(1);
}

const entry = resolveEntryPoint(projectRoot, { platform });

if (entry) {
  // Prevent any logs from the app.config.js
  // from being used in the output of this command.
  console.clear();
  // React Native's `PROJECT_ROOT` could be using a different root on MacOS (`/var` vs `/private/var`)
  // We need to make sure to get the real path, `resolveEntryPoint` is using this too
  console.log(
    absolute
      ? path.resolve(entry)
      : path.relative(fs.realpathSync(projectRoot), fs.realpathSync(entry))
  );
} else {
  console.error(`Error: Could not find entry file for project at: ${projectRoot}`);
  process.exit(1);
}
