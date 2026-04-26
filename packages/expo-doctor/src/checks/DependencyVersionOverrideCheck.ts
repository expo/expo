import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { joinWithCommasAnd } from '../utils/strings';

/**
 * Dependency traversal chains for critical transitive dependencies that should
 * not have their versions overridden via resolutions/overrides.
 *
 * When users upgrade, they tend to run into issues if they've added resolutions
 * or overrides that break our expectations of which versions of packages are installed.
 * There's a few internal dependencies that should never not pass version checks.
 *
 * To check these, we walk the dependency paths defined here and check the last
 * package's version against the penultimate package's range.
 *
 * NOTE: Only add packages here that cannot be overridden in most cases, and are known
 * to cause build failures if they are overridden! Typically, that doesn't include
 * Expo Modules.
 */
const dependencyChains: [...string[], string, string][] = [
  // these are critical versions tied to an SDK release that mustn't be changed
  ['expo', '@expo/cli'],
  ['expo', '@expo/config'],
  ['expo', '@expo/metro-config'],

  // @expo/metro-runtime is a peer, and often resolved to mute peer warnings, instead of being upgraded
  ['expo-router', '@expo/metro-runtime'],

  // metro packages are commonly resolved, and this will cause issues
  ['expo', '@expo/metro', 'metro'],
  ['expo', '@expo/metro', 'metro-babel-transformer'],
  ['expo', '@expo/metro', 'metro-cache'],
  ['expo', '@expo/metro', 'metro-cache-key'],
  ['expo', '@expo/metro', 'metro-config'],
  ['expo', '@expo/metro', 'metro-core'],
  ['expo', '@expo/metro', 'metro-file-map'],
  ['expo', '@expo/metro', 'metro-minify-terser'],
  ['expo', '@expo/metro', 'metro-resolver'],
  ['expo', '@expo/metro', 'metro-runtime'],
  ['expo', '@expo/metro', 'metro-source-map'],
  ['expo', '@expo/metro', 'metro-symbolicate'],
  ['expo', '@expo/metro', 'metro-transform-plugins'],
  ['expo', '@expo/metro', 'metro-transform-worker'],
];

interface ResolvedPackage {
  dir: string;
  pkg: { version: string; dependencies?: Record<string, string> };
}

/**
 * Resolve a package's package.json from a base directory using Node resolution.
 * Returns the parsed package.json and the package directory, or null if not found.
 */
function resolvePackage(baseDir: string, packageName: string): ResolvedPackage | null {
  const packageJsonPath = resolveFrom.silent(baseDir, `${packageName}/package.json`);
  if (!packageJsonPath) {
    return null;
  }
  try {
    return {
      dir: path.dirname(packageJsonPath),
      pkg: JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')),
    };
  } catch {
    return null;
  }
}

function getOverridesEntries(pkg: Record<string, any>): Record<string, string> {
  // npm uses "overrides", yarn uses "resolutions", pnpm uses "pnpm.overrides" or "resolutions"
  return {
    ...pkg.resolutions,
    ...pkg.overrides,
    ...pkg.pnpm?.overrides,
  };
}

export class DependencyVersionOverrideCheck implements DoctorCheck {
  description = 'Check for overridden dependencies';

  sdkVersionRange = '>=55.0.0';

  async runAsync({ pkg, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const overriddenPackages: string[] = [];

    const allOverrides = getOverridesEntries(pkg);

    const checkChain = (chain: [...string[], string, string]) => {
      const dependencyName = chain[chain.length - 1]!;
      const parentName = chain[chain.length - 2]!;

      // Walk the chain, resolving each package from the previous package's directory
      let resolveDir = projectRoot;
      let parentResolved: ResolvedPackage | undefined;
      for (let idx = 0; idx < chain.length - 1; idx++) {
        const parentPackageName = chain[idx]!;
        const childPackageName = chain[idx + 1]!;
        const resolved = resolvePackage(resolveDir, parentPackageName);
        if (!resolved?.pkg.dependencies?.[childPackageName]) {
          return;
        }
        resolveDir = resolved.dir;
        parentResolved = resolved;
      }

      const expectedRange = parentResolved?.pkg.dependencies?.[dependencyName];
      if (!parentResolved || !expectedRange) {
        return;
      }

      const installedResolved = resolvePackage(parentResolved.dir, dependencyName);
      const actualVersion = installedResolved?.pkg.version;
      if (!actualVersion || !semver.valid(actualVersion)) {
        return;
      }

      if (!semver.satisfies(actualVersion, expectedRange)) {
        issues.push(
          `"${parentName}" should install "${dependencyName}@${expectedRange}", but ${actualVersion} is installed.`
        );
        if (allOverrides[dependencyName]) {
          overriddenPackages.push(dependencyName);
        }
      }
    };

    for (const chain of dependencyChains) {
      checkChain(chain);
    }

    const advice: string[] = [];
    if (issues.length) {
      issues.unshift(
        (issues.length > 1
          ? 'Incompatible versions of critical dependencies are installed, '
          : 'An incompatible version of a critical dependency is installed, ') +
          'which is unsupported and may cause unexpected behavior.'
      );
      if (overriddenPackages.length) {
        advice.push(
          `Remove the resolution/override for ${joinWithCommasAnd(overriddenPackages)} from your package.json and reinstall your dependencies.`
        );
      } else {
        advice.push(`Reinstall your dependencies and check that they're not in a corrupted state.`);
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}
