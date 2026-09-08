/**
 * Module discovery & classification for the Expo SwiftPM plugin: locate built
 * xcframeworks, find module roots, and decide whether a module needs React wired
 * in / is pure-Swift. Filesystem reads only; the React-detection predicate is
 * split out as a pure function (`textImportsReact`) for unit testing.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// The core layer genuinely needs React/Hermes/jsi — it *is* the React/JSI bridge.
const CORE_REACT_PRODUCTS = new Set(['ExpoModulesCore', 'ExpoModulesJSI', 'ExpoModulesWorklets']);

// Directories classification never looks into: tests, vendored deps, build output.
const IGNORED_DIR_RX = /^(Tests?|__tests__|node_modules|build|\.build)$/;

function isIgnoredDir(name) {
  return IGNORED_DIR_RX.test(name);
}

// A direct source-level import of the React/Hermes/jsi families (NOT ExpoModulesCore).
const REACT_IMPORT_RX =
  /(#import\s*[<"](React|react|ReactCommon|RCTDeprecation|hermes|jsi|cxxreact|jsinspector|jsireact)[/>]|@?import\s+(React|ReactCommon|ReactAppDependencyProvider|hermes|jsi)\b)/;

/** Whether a chunk of source text imports the React/Hermes/jsi families. Pure — unit-testable. */
function textImportsReact(content) {
  return content.split('\n').some((l) => REACT_IMPORT_RX.test(l));
}

/** Walk up from a directory to the nearest npm package root (has package.json). */
function findModuleRoot(startDir) {
  let dir = startDir;
  while (dir && path.dirname(dir) !== dir) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return startDir;
}

/**
 * Absolute paths RN should watch for autolinking staleness (the `watchPaths`
 * plugin contract): each module's checked-in Package.swift and its
 * expo-module.config.json. Editing either must trip the in-build re-sync —
 * the manifest drives the generated wrapper packages, the config drives module
 * resolution. Only existing paths are returned (RN warn-and-drops the rest,
 * but a vanished path is its own staleness signal handled RN-side).
 */
function collectWatchPaths(moduleRoots) {
  const watchPaths = [];
  for (const root of moduleRoots) {
    for (const name of ['Package.swift', 'expo-module.config.json']) {
      const candidate = path.join(root, name);
      if (fs.existsSync(candidate)) watchPaths.push(candidate);
    }
  }
  return watchPaths;
}

function sourceTreeImportsReact(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (isIgnoredDir(e.name)) continue;
      if (sourceTreeImportsReact(p)) return true;
    } else if (/\.(swift|m|mm|c|h|hpp|cpp|cc)$/.test(e.name)) {
      let content = '';
      try {
        content = fs.readFileSync(p, 'utf8');
      } catch {
        continue;
      }
      if (textImportsReact(content)) return true;
    }
  }
  return false;
}

/**
 * The ignored directories under `dir`, relative to it and sorted. A generated
 * target must exclude exactly what classification skipped, or its production
 * library compiles test sources (and their `@testable` imports and mocks).
 * An ignored directory is not descended into: SwiftPM rejects an exclude path
 * already covered by an excluded ancestor.
 */
function collectIgnoredDirs(dir, prefix = '') {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const ignored = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (isIgnoredDir(e.name)) ignored.push(rel);
    else ignored.push(...collectIgnoredDirs(path.join(dir, e.name), rel));
  }
  return prefix ? ignored : ignored.sort();
}

/**
 * Whether a module needs React wired into its manifest. ExpoModulesCore strips
 * React from its public Swift interface, so a module that only uses the Expo
 * Modules API does NOT inherit React — only modules whose own source imports the
 * React/Hermes/jsi families (or the core bridge layer itself) do.
 */
function moduleNeedsReact(podName, moduleRoot) {
  if (CORE_REACT_PRODUCTS.has(podName)) return true;
  for (const sub of ['ios', 'apple', 'common']) {
    const dir = path.join(moduleRoot, sub);
    if (sourceTreeImportsReact(dir)) return true;
  }
  return false;
}

/** Cheap check: a module is pure-Swift if its iOS/apple source has no .m/.mm/.c/.cpp files. */
function isPureSwift(moduleRoot) {
  const hasNonSwift = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (isIgnoredDir(e.name)) continue;
        if (hasNonSwift(p)) return true;
      } else if (/\.(m|mm|c|cpp|cc)$/.test(e.name)) {
        return true;
      }
    }
    return false;
  };
  return ['ios', 'apple']
    .map((s) => path.join(moduleRoot, s))
    .filter((d) => fs.existsSync(d))
    .every((d) => !hasNonSwift(d));
}

module.exports = {
  CORE_REACT_PRODUCTS,
  REACT_IMPORT_RX,
  textImportsReact,
  sourceTreeImportsReact,
  collectIgnoredDirs,
  collectWatchPaths,
  findModuleRoot,
  moduleNeedsReact,
  isPureSwift,
};
