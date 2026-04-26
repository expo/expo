import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import { XCFramework } from './constants';
import type { BuildConfiguration, ModuleXCFramework } from './types';

/**
 * Pod directories that host xcframeworks already covered by the fixed `XCFramework` constants
 * (hermesvm, React, ReactNativeDependencies). Excluded from enumerated Expo-module results
 * so they aren't double-copied into the Swift Package output.
 */
const RESERVED_POD_DIRS = new Set([
  'hermes-engine',
  'React-Core-prebuilt',
  'ReactNativeDependencies',
]);

/**
 * Scans `ios/Pods/` for Expo modules that were installed as prebuilt xcframeworks (i.e. pod
 * install ran with `EXPO_USE_PRECOMPILED_MODULES=1`). A pod is identified as "precompiled"
 * when its directory contains both a `<Product>.xcframework/` dir and an
 * `artifacts/<Product>-{debug,release}.tar.gz` tarball — the exact signature written by
 * `Expo::PrecompiledModules.ensure_artifacts` in expo-modules-autolinking.
 */
export const enumeratePrecompiledModules = (iosDir: string): ModuleXCFramework[] => {
  const podsDir = path.join(iosDir, 'Pods');
  if (!fs.existsSync(podsDir)) {
    return [];
  }

  const results: ModuleXCFramework[] = [];
  for (const entry of fs.readdirSync(podsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || RESERVED_POD_DIRS.has(entry.name)) {
      continue;
    }
    const podDir = path.join(podsDir, entry.name);
    const artifactsDir = path.join(podDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
      continue;
    }

    const tarballs = fs.readdirSync(artifactsDir).filter((f) => f.endsWith('.tar.gz'));
    if (tarballs.length === 0) {
      continue;
    }

    const xcframeworks = fs
      .readdirSync(podDir, { withFileTypes: true })
      .filter((f) => f.isDirectory() && f.name.endsWith('.xcframework'))
      .map((f) => f.name);

    for (const xcframework of xcframeworks) {
      const name = xcframework.replace(/\.xcframework$/, '');
      // Confirm the tarball naming lines up with this xcframework to avoid mistakenly
      // picking up unrelated vendored frameworks that happen to sit next to an artifacts/ dir.
      const hasMatchingTarball = tarballs.some(
        (f) => f === `${name}-debug.tar.gz` || f === `${name}-release.tar.gz`
      );
      if (!hasMatchingTarball) {
        continue;
      }
      results.push({
        name,
        podDir,
        xcframeworkPath: path.join(podDir, xcframework),
      });
    }
  }

  return results;
};

/**
 * Reads `<podDir>/artifacts/.last_build_configuration` and, if it doesn't match the requested
 * build configuration, shells out to autolinking's `replace-xcframework.js` to extract the
 * correct flavor tarball in place. This protects against the user having run
 * `EXPO_PRECOMPILED_FLAVOR=debug pod install` but then asking for a `--release` brownfield
 * build (or vice-versa).
 */
export const ensureCorrectFlavor = async (
  module: ModuleXCFramework,
  buildConfiguration: BuildConfiguration,
  options: { verbose: boolean }
): Promise<void> => {
  const flavor = buildConfiguration.toLowerCase();
  const lastConfigFile = path.join(module.podDir, 'artifacts', '.last_build_configuration');
  if (fs.existsSync(lastConfigFile)) {
    const last = fs.readFileSync(lastConfigFile, 'utf8').trim();
    if (last === flavor) {
      return;
    }
  }

  let scriptPath: string;
  try {
    scriptPath = require.resolve('expo-modules-autolinking/scripts/ios/replace-xcframework.js', {
      paths: [process.cwd()],
    });
  } catch {
    throw new Error(
      `Could not locate expo-modules-autolinking's replace-xcframework.js. ` +
        `Install expo-modules-autolinking in your project (it is usually a transitive dep of expo) ` +
        `and re-run with --use-prebuilds.`
    );
  }

  await runCommand('node', [scriptPath, '-c', flavor, '-m', module.name, '-x', module.podDir], {
    verbose: options.verbose,
  });
};

export const resolvedFixedXCFrameworks = (): string[] => {
  return Object.values(XCFramework).map((f) => f.name);
};
