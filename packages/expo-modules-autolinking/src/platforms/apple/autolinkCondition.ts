import fs from 'fs';
import Module from 'node:module';
import path from 'path';

import { scanDependenciesRecursively } from '../../dependencies';
import type { AppleAutolinkCondition } from '../../types';
import { fastJoin, maybeRealpath } from '../../utils';

declare module 'node:module' {
  export function _nodeModulePaths(base: string): readonly string[];
}

const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';

export interface AppleAutolinkContext {
  /** JS project root, used to resolve npm packages. */
  appRoot?: string;
  /** Native (iOS) project directory where `Podfile.properties.json` lives. */
  commandRoot?: string;
}

/**
 * Evaluates whether a conditional podspec entry should be autolinked.
 *
 * This runs in the autolinking resolver — the component that already resolves the
 * dependency graph — so installability is checked in-process rather than from a
 * subprocess at `pod install` time.
 */
export async function appleAutolinkConditionMetAsync(
  condition: AppleAutolinkCondition,
  context: AppleAutolinkContext
): Promise<boolean> {
  if ('npmPackage' in condition && condition.npmPackage) {
    const packageName = condition.npmPackage;
    const appRoot = context.appRoot;
    if (!appRoot) {
      return false;
    }
    // Cheap, hoist-aware check first; fall back to a deep dependency-graph walk for strict
    // (non-hoisted) layouts where a transitively-installed package isn't directly reachable
    // from the project root — e.g. pnpm with `node-linker=isolated`.
    return (
      (await isPackageHoistResolvable(packageName, appRoot)) ||
      (await isPackageInDependencyGraph(packageName, appRoot))
    );
  }

  if ('podfileProperty' in condition && condition.podfileProperty) {
    const propertiesRoot = context.commandRoot ?? context.appRoot;
    if (!propertiesRoot) {
      return false;
    }
    const properties = readPodfileProperties(propertiesRoot);
    // Linked unless the property is explicitly set to the disabled value.
    return properties[condition.podfileProperty] !== condition.disabledValue;
  }

  return false;
}

/** True when `packageName`'s `package.json` is reachable from `fromDir` via Node's node_modules lookup. */
async function isPackageHoistResolvable(packageName: string, fromDir: string): Promise<boolean> {
  try {
    for (const modulePath of Module._nodeModulePaths(fromDir)) {
      const packageJsonPath = await maybeRealpath(
        fastJoin(fastJoin(modulePath, packageName), 'package.json')
      );
      if (packageJsonPath != null) {
        return true;
      }
    }
  } catch {
    // ignore and report not resolvable
  }
  return false;
}

/** True when `packageName` appears anywhere in the recursively-resolved dependency graph. */
async function isPackageInDependencyGraph(packageName: string, appRoot: string): Promise<boolean> {
  try {
    const result = await scanDependenciesRecursively(appRoot);
    return result[packageName] != null;
  } catch {
    return false;
  }
}

function readPodfileProperties(nativeRoot: string): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path.join(nativeRoot, APPLE_PROPERTIES_FILE), 'utf8'));
  } catch {
    return {};
  }
}
