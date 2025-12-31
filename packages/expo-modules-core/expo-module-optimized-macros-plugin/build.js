#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  execSync('swift build -c release', { stdio: 'inherit' });

  fs.copyFileSync(
    path.join(__dirname, '.build/arm64-apple-macosx/release/ExpoModulesOptimizedMacros-tool'),
    path.join(__dirname, '../ios/Macros/ExpoModulesOptimizedMacros-tool')
  );

  fs.copyFileSync(
    path.join(__dirname, 'Sources/ExpoModulesOptimized/ExpoModulesOptimized.swift'),
    path.join(__dirname, '../ios/Macros/ExpoModulesOptimized.swift')
  );
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
