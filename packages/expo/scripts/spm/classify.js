/**
 * Module discovery & classification for the Expo SwiftPM plugin: find module
 * roots and Apple source directories, and decide whether a module needs React
 * wired in / is pure-Swift. Filesystem reads only; the React-detection predicate is
 * split out as a pure function (`textImportsReact`) for unit testing.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// The core layer genuinely needs React/Hermes/jsi — it *is* the React/JSI bridge.
const CORE_REACT_PRODUCTS = new Set(['ExpoModulesCore', 'ExpoModulesJSI', 'ExpoModulesWorklets']);

// Directories classification never looks into: tests, vendored deps, build output.
const IGNORED_DIR_RX = /^(Tests?|__tests__|node_modules|build|\.build)$/;

// Where a module keeps its Apple sources, in the order they are looked for.
const APPLE_SOURCE_DIRS = ['ios', 'apple'];

/** The first of the module's Apple source directories that exists, or null. */
function appleSourceDir(moduleRoot) {
  return (
    APPLE_SOURCE_DIRS.map((dir) => path.join(moduleRoot, dir)).find((dir) => fs.existsSync(dir)) ??
    null
  );
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
 * The package root a prebuilt-metadata entry documents, or null when it documents
 * none or the directory is gone: a stale entry is not identity.
 */
function documentedPackageRoot(entry) {
  const root = entry?.packageRoot;
  return root != null && fs.existsSync(root) ? root : null;
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

/**
 * Every file under `dir` outside the ignored directories, and those directories
 * relative to `dir`, sorted. An ignored directory is not descended into: SwiftPM
 * rejects an exclude path already covered by an excluded ancestor.
 */
function walkSourceTree(dir) {
  const files = [];
  const ignoredDirs = [];
  const visit = (current, prefix) => {
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (!e.isDirectory()) files.push(path.join(current, e.name));
      else if (IGNORED_DIR_RX.test(e.name)) ignoredDirs.push(rel);
      else visit(path.join(current, e.name), rel);
    }
  };
  visit(dir, '');
  return { files, ignoredDirs: ignoredDirs.sort() };
}

const REACT_SCANNED_RX = /\.(swift|m|mm|c|h|hpp|cpp|cc)$/;
const NON_SWIFT_SOURCE_RX = /\.(m|mm|c|cpp|cc)$/;

function fileImportsReact(file) {
  try {
    return textImportsReact(fs.readFileSync(file, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * What classification needs from a module's Apple sources, from one walk of each
 * source directory. `ignoredDirs` are the ones under the source directory a
 * generated target compiles: it must exclude exactly what classification skipped,
 * or its production library compiles test sources (and their `@testable` imports
 * and mocks). React is looked for in `common/` too, which a module shares across
 * platforms.
 */
function scanAppleSources(moduleRoot) {
  const sourceDir = appleSourceDir(moduleRoot);
  let pureSwift = true;
  let importsReact = false;
  let ignoredDirs = [];
  for (const sub of [...APPLE_SOURCE_DIRS, 'common']) {
    const dir = path.join(moduleRoot, sub);
    const tree = walkSourceTree(dir);
    if (dir === sourceDir) ignoredDirs = tree.ignoredDirs;
    for (const file of tree.files) {
      if (sub !== 'common' && NON_SWIFT_SOURCE_RX.test(file)) pureSwift = false;
      if (!importsReact && REACT_SCANNED_RX.test(file)) importsReact = fileImportsReact(file);
    }
  }
  return { hasSources: sourceDir != null, pureSwift, importsReact, ignoredDirs };
}

/**
 * Whether a module needs React wired into its manifest. ExpoModulesCore strips
 * React from its public Swift interface, so a module that only uses the Expo
 * Modules API does NOT inherit React — only modules whose own source imports the
 * React/Hermes/jsi families (or the core bridge layer itself) do.
 */
function moduleNeedsReact(podName, sources) {
  return CORE_REACT_PRODUCTS.has(podName) || sources.importsReact;
}

module.exports = {
  APPLE_SOURCE_DIRS,
  CORE_REACT_PRODUCTS,
  REACT_IMPORT_RX,
  appleSourceDir,
  textImportsReact,
  collectWatchPaths,
  documentedPackageRoot,
  findModuleRoot,
  moduleNeedsReact,
  scanAppleSources,
};
