#!/usr/bin/env node
/**
 * Per-build flavor swap for Expo's precompiled xcframeworks (run from the app's
 * "Sync SPM Autolinking" build phase on EVERY build).
 *
 * SwiftPM can't branch a `.binaryTarget(path:)` on $CONFIGURATION, and Xcode's
 * implicit Embed step copies the binaryTarget's framework by RESOLVING its source
 * path at copy time — so a build-time rsync over $BUILT_PRODUCTS_DIR (like RN's own
 * swap) misses the embed copy. The fix: the generated precompiled packages point
 * their binaryTargets at a stable `artifacts/<Name>.xcframework` SYMLINK; repointing
 * that symlink to the flavor matching $CONFIGURATION covers BOTH link and embed.
 *
 * Belt-and-braces (mirroring RN): if the frameworks are already copied into
 * $BUILT_PRODUCTS_DIR, rsync the correct-flavor slice over them too.
 *
 * Never fatal: a swap failure must not break the build. Exits 0 always.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Pure decision logic (unit-tested)
// ---------------------------------------------------------------------------

/** Map an Xcode CONFIGURATION to a precompile flavor. Only "Release" → release; everything else → debug (mirrors RN). */
function flavorForConfiguration(configuration) {
  return configuration === 'Release' ? 'release' : 'debug';
}

/**
 * Rewrite a flavor-specific precompile path to the desired flavor by swapping the
 * `/output/<flavor>/xcframeworks/` segment. Returns the rewritten path, or null if
 * the path doesn't look like a precompile output path (leave such links alone).
 */
function rewriteFlavorInPath(targetPath, desiredFlavor) {
  const rx = /\/output\/(debug|release)\/xcframeworks\//;
  if (!rx.test(targetPath)) return null;
  return targetPath.replace(rx, `/output/${desiredFlavor}/xcframeworks/`);
}

/**
 * Describe a flavored artifact for RN's plugin contract (`flavoredArtifacts` in the
 * plugin result): the stable symlink binaryTargets reference, plus the per-flavor
 * xcframework paths it can be repointed to. Flavors whose path can't be derived are
 * omitted; the consumer treats a missing flavor as "not built" and warns.
 */
function describeFlavoredArtifact(name, link, xcframeworkPath) {
  const flavors = {};
  for (const flavor of ['debug', 'release']) {
    const flavorPath = rewriteFlavorInPath(xcframeworkPath, flavor);
    if (flavorPath != null) {
      flavors[flavor] = flavorPath;
    }
  }
  return { name, link, flavors };
}

/**
 * Pick the xcframework slice (library identifier) matching an Xcode PLATFORM_NAME.
 * `libraries` are the `AvailableLibraries` entries from the xcframework Info.plist.
 * Returns the LibraryIdentifier, or null if no supported platform matches.
 */
function sliceForPlatform(libraries, platformName) {
  // platformName → { platform, wantSimulator }
  const map = {
    iphonesimulator: { platform: 'ios', simulator: true },
    iphoneos: { platform: 'ios', simulator: false },
  };
  const want = map[platformName];
  if (want == null) return null;
  const match = (libraries ?? []).find((lib) => {
    const isSimulator = lib.SupportedPlatformVariant === 'simulator';
    return lib.SupportedPlatform === want.platform && isSimulator === want.simulator;
  });
  return match ? match.LibraryIdentifier : null;
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

/** List the generated precompiled artifact symlinks under each expo-precompiled package's artifacts dir. */
function findArtifactLinks(srcroot) {
  const base = path.join(srcroot, 'build', 'generated', 'autolinking', 'expo', 'expo-precompiled');
  const links = [];
  let pkgs = [];
  try {
    pkgs = fs.readdirSync(base, { withFileTypes: true });
  } catch {
    return links;
  }
  for (const pkg of pkgs) {
    if (!pkg.isDirectory()) continue;
    const artifactsDir = path.join(base, pkg.name, 'artifacts');
    let entries = [];
    try {
      entries = fs.readdirSync(artifactsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink() && entry.name.endsWith('.xcframework')) {
        links.push(path.join(artifactsDir, entry.name));
      }
    }
  }
  return links;
}

/** Repoint an artifacts symlink to the desired flavor. Returns true if it was actually changed. */
function repointLink(link, desiredFlavor) {
  const current = fs.readlinkSync(link);
  const desired = rewriteFlavorInPath(current, desiredFlavor);
  if (desired == null || desired === current) return false;
  if (!fs.existsSync(desired)) {
    console.warn(
      `expo-swap-flavor: WARNING — ${desiredFlavor} flavor not built for ${path.basename(link)}; ` +
        `expected ${desired}. Leaving symlink at the current flavor. ` +
        `Build it with the precompile pipeline, then rebuild.`
    );
    return false;
  }
  fs.rmSync(link, { force: true });
  fs.symlinkSync(desired, link);
  return true;
}

/** Read the AvailableLibraries array from an xcframework's Info.plist (via plutil). */
function readAvailableLibraries(xcframeworkPath) {
  const plist = path.join(xcframeworkPath, 'Info.plist');
  const json = execFileSync('plutil', ['-convert', 'json', '-o', '-', plist], {
    encoding: 'utf8',
  });
  return JSON.parse(json).AvailableLibraries ?? [];
}

/**
 * Belt-and-braces: if a framework was already copied into $BUILT_PRODUCTS_DIR
 * (directly or under PackageFrameworks/), rsync the desired-flavor slice over it.
 * Returns true if a framework was swapped.
 */
function swapBuiltProduct(link, desiredFlavor, builtProductsDir, platformName) {
  const name = path.basename(link, '.xcframework');
  const candidates = [
    path.join(builtProductsDir, `${name}.framework`),
    path.join(builtProductsDir, 'PackageFrameworks', `${name}.framework`),
  ].filter((p) => fs.existsSync(p));
  if (candidates.length === 0) return false;

  // The link already points at the desired flavor (repointed just above).
  const xcframework = fs.readlinkSync(link);
  let libraries;
  try {
    libraries = readAvailableLibraries(xcframework);
  } catch (e) {
    console.warn(`expo-swap-flavor: WARNING — could not read Info.plist for ${name}: ${e.message}`);
    return false;
  }
  const slice = sliceForPlatform(libraries, platformName);
  if (slice == null) {
    console.warn(
      `expo-swap-flavor: skipping ${name} — no ${desiredFlavor} slice for PLATFORM_NAME=${platformName}.`
    );
    return false;
  }
  const source = path.join(xcframework, slice, `${name}.framework`) + path.sep;
  let swapped = false;
  for (const dest of candidates) {
    execFileSync('rsync', ['-a', '--delete', source, dest + path.sep]);
    swapped = true;
  }
  return swapped;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { CONFIGURATION, SRCROOT, BUILT_PRODUCTS_DIR, PLATFORM_NAME } = process.env;
  if (!SRCROOT) {
    console.warn('expo-swap-flavor: SRCROOT unset — nothing to do.');
    return;
  }
  const flavor = flavorForConfiguration(CONFIGURATION);
  const links = findArtifactLinks(SRCROOT);

  let repointed = 0;
  let swapped = 0;
  for (const link of links) {
    if (repointLink(link, flavor)) repointed += 1;
    // Even if the link was already correct, the built-product copy may be stale.
    if (BUILT_PRODUCTS_DIR && PLATFORM_NAME) {
      if (swapBuiltProduct(link, flavor, BUILT_PRODUCTS_DIR, PLATFORM_NAME)) swapped += 1;
    }
  }

  console.log(
    `expo-swap-flavor: ${flavor} — repointed ${repointed} symlink(s), swapped ${swapped} framework(s)`
  );
}

// Run only when invoked directly (not when required by tests).
if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.warn(`expo-swap-flavor: WARNING — swap failed (non-fatal): ${e && e.message}`);
  }
  process.exit(0);
}

module.exports = {
  flavorForConfiguration,
  rewriteFlavorInPath,
  sliceForPlatform,
  describeFlavoredArtifact,
};
