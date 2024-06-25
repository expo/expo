/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { minimatch } from 'minimatch';
import path from 'path';

import { findUpPackageJsonPath } from './findUpPackageJsonPath';

// const debug = require('debug')('expo:metro-config:serializer:side-effects') as typeof console.log;

export function hasSideEffect(
  graph: ReadOnlyGraph,
  value: Module<MixedOutput>,
  checked: Set<string> = new Set()
): boolean {
  // @ts-expect-error: Not on type.
  if (value?.sideEffects) {
    return true;
  }
  // Recursively check if any of the dependencies have side effects.
  for (const depReference of value.dependencies.values()) {
    if (checked.has(depReference.absolutePath)) {
      continue;
    }
    checked.add(depReference.absolutePath);
    const dep = graph.dependencies.get(depReference.absolutePath)!;
    if (hasSideEffect(graph, dep, checked)) {
      return true;
    }
  }
  return false;
}

export function hasSideEffectWithDebugTrace(
  options: SerializerOptions,
  graph: ReadOnlyGraph,
  value: Module<MixedOutput>,
  parentTrace: string[] = [value.path],
  checked: Set<string> = new Set()
): [boolean, string[]] {
  if (getShallowSideEffect(options, value)) {
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
  return [false, []];
}

const pkgJsonCache = new Map<string, any>();

const getPackageJsonMatcher = (
  options: Pick<SerializerOptions, 'projectRoot'>,
  dir: string
): any => {
  let packageJson: any;
  let packageJsonPath: string | null = null;
  if (typeof options._test_getPackageJson === 'function') {
    [packageJson, packageJsonPath] = options._test_getPackageJson(dir);
  } else {
    const cached = pkgJsonCache.get(dir);
    if (cached) {
      return cached;
    }
    packageJsonPath = findUpPackageJsonPath(options.projectRoot, dir);
    if (!packageJsonPath) {
      return null;
    }
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  }
  if (!packageJsonPath) {
    return null;
  }

  // TODO: Split out and unit test.
  const dirRoot = path.dirname(packageJsonPath);
  const isSideEffect = (fp: string): boolean | null => {
    // Default is that everything is a side-effect unless explicitly marked as not.
    // if (packageJson.sideEffects == null) {
    //   // TODO: How to avoid needing this hardcoded list?
    //   if (
    //     [
    //       'react',
    //       '@babel/runtime',
    //       'invariant',
    //       'react-dom',
    //       'scheduler',
    //       'inline-style-prefixer',
    //       'metro-runtime',
    //       'fbjs',
    //       '@react-native/normalize-color',
    //       '@react-native/asset-registry',
    //       'postcss-value-parser',
    //       'css-in-js-utils',
    //       'nullthrows',
    //       'nanoid',
    //     ].includes(packageJson.name)
    //   ) {
    //     console.log('Skipping FX for:', packageJson.name);
    //     return null;
    //   }

    //   return true;
    // }

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
    return false;
  };

  pkgJsonCache.set(dir, isSideEffect);
  return isSideEffect;
};

function getShallowSideEffect(options: SerializerOptions, value: Module<MixedOutput>) {
  if (value?.sideEffects !== undefined) {
    return value.sideEffects;
  }
  const isSideEffect = detectHasSideEffectInPackageJson(options, value);
  value.sideEffects = isSideEffect;
  return isSideEffect;
}

function detectHasSideEffectInPackageJson(options: SerializerOptions, value: Module<MixedOutput>) {
  if (value.sideEffects !== undefined) {
    return value.sideEffects;
  }
  // Don't perform lookup on virtual modules.
  if (value.path.startsWith('\0')) {
    return false;
  }

  if (value.output.some((output) => output.type === 'js/module')) {
    const isSideEffect = getPackageJsonMatcher(options, value.path);
    if (isSideEffect === false) {
      return false;
    } else if (isSideEffect == null) {
      return;
    }
    return isSideEffect(value.path);
  }

  return null;
}
