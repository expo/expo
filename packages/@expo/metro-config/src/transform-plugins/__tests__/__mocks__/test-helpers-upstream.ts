/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Copy of the upstream helpers.

import {
  transformSync,
  types as t,
  type Node as BabelNode,
  type PluginOptions as EntryOptions,
  type PluginTarget as EntryTarget,
  type ConfigItem,
  type TransformOptions as BabelCoreOptions,
} from '@babel/core';
import generate from '@babel/generator';
import assert from 'node:assert';

function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

type BabelNodeFile = t.File;

type PluginEntry =
  | EntryTarget
  | ConfigItem
  | [EntryTarget]
  | [EntryTarget, EntryOptions]
  | [EntryTarget, EntryOptions, string | void];

function makeTransformOptions<OptionsT extends EntryOptions>(
  plugins: readonly PluginEntry[],
  options: OptionsT
): BabelCoreOptions {
  return {
    ast: true,
    babelrc: false,
    browserslistConfigFile: false,
    code: false,
    compact: true,
    configFile: false,
    plugins: plugins.length
      ? plugins.map((plugin) => [plugin, options])
      : [() => ({ visitor: {} })],
    sourceType: 'module',
  };
}

function validateOutputAst(ast: BabelNode) {
  const seenNodes = new Set<BabelNode>();
  t.traverseFast(nullthrows(ast), function enter(node) {
    if (seenNodes.has(node)) {
      throw new Error(
        'Found a duplicate ' +
          node.type +
          ' node in the output, which can cause' +
          ' undefined behavior in Babel.'
      );
    }
    seenNodes.add(node);
  });
}

export function transformToAst<T extends EntryOptions>(
  plugins: readonly PluginEntry[],
  code: string,
  options: T
): BabelNodeFile {
  const transformResult = transformSync(code, makeTransformOptions(plugins, options));
  const ast = nullthrows(transformResult.ast);
  validateOutputAst(ast);
  return ast;
}

function transform(
  code: string,
  plugins: readonly PluginEntry[],
  options: EntryOptions | null | undefined
) {
  return generate(transformToAst(plugins, code, options)).code;
}

export const compare = (
  plugins: readonly PluginEntry[],
  code: string,
  expected: string,
  options: EntryOptions | null | undefined = {}
) => {
  expect(transform(code, plugins, options)).toBe(transform(expected, [], {}));
};
