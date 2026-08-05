#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Script to resolve or restore symlinks when publishing a package with npm.
 *
 * Usage:
 *   node scripts/resolve-symlinks.js resolve  - Replace symlinks with their actual content
 *   node scripts/resolve-symlinks.js restore  - Restore original symlinks
 */
const PACKAGE_ROOT = path.join(__dirname, '..');
const CACHE_FILE = path.join(__dirname, '.symlinks-cache.json');

const SYMLINKED_FILES = ['plugin/templates/ios/ExpoAppDelegate.swift'];

function resolveSymlinks() {
  const cache = {};

  for (const file of SYMLINKED_FILES) {
    const fullPath = path.join(PACKAGE_ROOT, file);
    const target = fs.readlinkSync(fullPath);
    const realPath = fs.realpathSync(fullPath);
    const content = fs.readFileSync(realPath);

    cache[file] = target;

    fs.unlinkSync(fullPath);
    fs.writeFileSync(fullPath, content);

    console.log(`Resolved: ${file}`);
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function restoreSymlinks() {
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

  for (const file of SYMLINKED_FILES) {
    const fullPath = path.join(PACKAGE_ROOT, file);
    const target = cache[file];

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    fs.symlinkSync(target, fullPath);
    console.log(`Restored: ${file} -> ${target}`);
  }

  fs.unlinkSync(CACHE_FILE);
}

const command = process.argv[2];

switch (command) {
  case 'resolve':
    resolveSymlinks();
    break;
  case 'restore':
    restoreSymlinks();
    break;
  default:
    console.error('Usage: node resolve-symlinks.js <resolve|restore>');
    process.exit(1);
}
