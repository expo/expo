/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import minimatch from 'minimatch';
import path from 'path';

import { findUpPackageJsonPath } from './findUpPackageJsonPath';

const debug = require('debug')('expo:side-effects') as typeof console.log;

// const debug = require('debug')('expo:metro-config:serializer:side-effects') as typeof console.log;

type AdvancedModule = Module<MixedOutput> & {
  sideEffects?: boolean | null;
};

export function hasSideEffectWithDebugTrace(
  options: SerializerOptions,
  graph: ReadOnlyGraph,
  value: AdvancedModule,
  parentTrace: string[] = [value.path],
  checked: Set<string> = new Set()
): [boolean | null, string[]] {
  const currentModuleHasSideEffect = getShallowSideEffect(options, value);
  if (currentModuleHasSideEffect) {
    return [true, parentTrace];
  }
  // Recursively check if any of the dependencies have side effects.
  for (const depReference of value.dependencies.values()) {
    if (checked.has(depReference.absolutePath)) {
      continue;
    }
    checked.add(depReference.absolutePath);
    const dep = graph.dependencies.get(depReference.absolutePath)!;
    if (!dep) {
      continue;
    }

    const [hasSideEffect, trace] = hasSideEffectWithDebugTrace(
      options,
      graph,
      dep,
      [...parentTrace, depReference.absolutePath],
      checked
    );

    if (hasSideEffect) {
      // Propagate the side effect to the parent.
      value.sideEffects = true;

      return [true, trace];
    }
  }
  return [currentModuleHasSideEffect, []];
}

const pkgJsonCache = new Map<string, any>();

const getPackageJsonMatcher = (
  options: Pick<SerializerOptions, 'projectRoot' | 'serverRoot'> & {
    _test_getPackageJson?: (dir: string) => [any, string | null];
  },
  dir: string
): null | ((fp: string) => boolean | null) => {
  let packageJson: any;
  let packageJsonPath: string | null = null;
  if (typeof options._test_getPackageJson === 'function') {
    [packageJson, packageJsonPath] = options._test_getPackageJson(dir);
  } else {
    const cached = pkgJsonCache.get(dir);
    if (cached) {
      return cached;
    }

    packageJsonPath = findUpPackageJsonPath(dir);
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  }

  if (!packageJsonPath) {
    return null;
  }

  // TODO: Split out and unit test.
  const dirRoot = path.dirname(packageJsonPath);
  const isSideEffect = _createSideEffectMatcher(dirRoot, packageJson, packageJsonPath);
  pkgJsonCache.set(dir, isSideEffect);
  return isSideEffect;
};

export function _createSideEffectMatcher(
  dirRoot: string,
  packageJson: { sideEffects?: boolean | string[] },
  packageJsonPath: string = ''
): (fp: string) => boolean | null {
  return (fp: string) => {
    // Default is that everything is a side-effect unless explicitly marked as not.
    if (packageJson.sideEffects == null) {
      return null;
    }

    if (typeof packageJson.sideEffects === 'boolean') {
      return packageJson.sideEffects;
    } else if (Array.isArray(packageJson.sideEffects)) {
      const relativeName = path.relative(dirRoot, fp);
      return packageJson.sideEffects.some((sideEffect: any) => {
        if (typeof sideEffect === 'string') {
          return minimatch(relativeName, sideEffect.replace(/^\.\//, ''), {
            matchBase: true,
          });
        }
        return false;
      });
    }
    debug('Invalid sideEffects field in package.json:', packageJsonPath, packageJson.sideEffects);
    return null;
  };
}

function getShallowSideEffect(options: SerializerOptions, value: AdvancedModule): boolean | null {
  if (value?.sideEffects !== undefined) {
    return value.sideEffects;
  }
  const isSideEffect = detectHasSideEffectInPackageJson(options, value);
  value.sideEffects = isSideEffect;
  return isSideEffect;
}

function detectHasSideEffectInPackageJson(
  options: SerializerOptions,
  value: AdvancedModule
): boolean | null {
  if (value.sideEffects !== undefined) {
    return value.sideEffects;
  }
  // Don't perform lookup on virtual modules.
  if (isVirtualModule(value.path)) {
    return false;
  }

  if (value.output.some((output) => output.type === 'js/module')) {
    const isSideEffect = getPackageJsonMatcher(options, value.path);

    if (isSideEffect == null) {
      return null;
    }
    return isSideEffect(value.path);
  }

  return null;
}

export function isVirtualModule(path: string) {
  return path.startsWith('\0');
}
