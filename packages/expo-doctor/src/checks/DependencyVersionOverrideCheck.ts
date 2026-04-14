import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { joinWithCommasAnd } from '../utils/strings';

/**
 * Dependency traversal chains for critical transitive dependencies that should
 * not have their versions overridden via resolutions/overrides. Each chain is
 * an array of package names representing a path through the dependency graph.
 * The last entry is the package whose installed version is checked against the
 * range declared by its parent (second-to-last entry). Each package is resolved
 * from the previous package's directory using Node resolution, so this works
 * correctly with isolated node_modules layouts (e.g. pnpm). If any package
 * along the chain cannot be resolved, the check is skipped (e.g. expo-router
 * is optional).
 */
const dependencyChains: [...string[], string, string][] = [
  ['expo', '@expo/cli'],

  ['expo-router', '@expo/metro-runtime'],

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
  description = 'Check for overridden dependency versions that may cause issues';

  sdkVersionRange = '>=53.0.0';

  async runAsync({ pkg, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const overriddenPackages: string[] = [];

    const allOverrides = getOverridesEntries(pkg);

    for (const chain of dependencyChains) {
      const dependencyName = chain[chain.length - 1]!;
      const parentName = chain[chain.length - 2]!;

      // Walk the chain, resolving each package from the previous package's directory
      let resolveDir = projectRoot;
      let parentResolved: ResolvedPackage | undefined;
      let chainValid = true;
      for (let idx = 0; idx < chain.length - 1; idx++) {
        const parentPackageName = chain[idx]!;
        const childPackageName = chain[idx + 1]!;
        const resolved = resolvePackage(resolveDir, parentPackageName);
        if (!resolved || !resolved?.pkg.dependencies?.[childPackageName]) {
          chainValid = false;
          break;
        }
        resolveDir = resolved.dir;
        parentResolved = resolved;
      }

      const childPackageName = chain[chain.length - 1]!;
      const expectedRange = parentResolved?.pkg.dependencies?.[childPackageName];
      if (!chainValid || !parentResolved || !expectedRange) {
        continue;
      }

      const installedResolved = resolvePackage(parentResolved.dir, childPackageName);
      const actualVersion = installedResolved?.pkg.version;
      if (!actualVersion || !semver.valid(actualVersion)) {
        continue;
      }

      if (!semver.satisfies(actualVersion, expectedRange)) {
        issues.push(
          `"${parentName}" should install "${dependencyName}@${expectedRange}", but ${actualVersion} is installed.`
        );
        if (allOverrides[dependencyName]) {
          overriddenPackages.push(dependencyName);
        }
      }
    }

    const advice: string[] = [];
    if (issues.length) {
      advice.push(
        'An incompatible version of a critical dependency is installed, which is unsupported and may cause unexpected behavior.'
      );
      if (overriddenPackages.length) {
        advice.push(
          `Remove the resolution/override for ${joinWithCommasAnd(overriddenPackages)} from your package.json and reinstall your dependencies.`
        );
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}
