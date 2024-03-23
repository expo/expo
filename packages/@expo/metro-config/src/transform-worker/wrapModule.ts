/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on upstream but with our PR merged:
 * https://github.com/facebook/metro/blob/c6f6ca76840bef4415c8acbdec4491b84906da78/packages/metro/src/ModuleGraph/worker/JsFileWrapping.js#L1C1-L145C3
 * https://github.com/facebook/metro/pull/1230
 */
import { ParseResult } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { FunctionExpression, Program } from '@babel/types';
import assert from 'node:assert';

const WRAP_NAME = '$$_REQUIRE'; // note: babel will prefix this with _

export function wrapModule(
  fileAst: ParseResult<t.File>,
  importDefaultName: string,
  importAllName: string,
  dependencyMapName: string,
  globalPrefix: string,
  skipRequireRename: boolean
): {
  ast: t.File;
  requireName: string;
} {
  const params = buildParameters(importDefaultName, importAllName, dependencyMapName);
  const factory = functionFromProgram(fileAst.program, params);
  const def = t.callExpression(t.identifier(`${globalPrefix}__d`), [factory]);
  const ast = t.file(t.program([t.expressionStatement(def)]));

  // `require` doesn't need to be scoped when Metro serializes to iife because the local function
  // `require` will be used instead of the global one.
  const requireName = skipRequireRename ? 'require' : renameRequires(ast);

  return { ast, requireName };
}

function functionFromProgram(program: Program, parameters: readonly string[]): FunctionExpression {
  return t.functionExpression(
    undefined,
    parameters.map((name) => t.identifier(name)),
    t.blockStatement(program.body, program.directives)
  );
}

function buildParameters(
  importDefaultName: string,
  importAllName: string,
  dependencyMapName: string
): readonly string[] {
  return [
    'global',
    'require',
    importDefaultName,
    importAllName,
    'module',
    'exports',
    dependencyMapName,
  ];
}

// Renaming requires should ideally only be done when generating for the target
// that expects the custom require name in the optimize step.
// This visitor currently renames all `require` references even if the module
// contains a custom `require` declaration. This should be fixed by only renaming
// if the `require` symbol hasn't been re-declared.
function renameRequires(ast: t.File): string {
  let newRequireName = WRAP_NAME;

  traverse(ast, {
    Program(path) {
      const body = path.get('body.0.expression.arguments.0.body');

      assert(!Array.isArray(body), 'metro: Expected `body` to be a single path.');

      newRequireName = body.scope.generateUid(WRAP_NAME);
      body.scope.rename('require', newRequireName);
    },
  });

  return newRequireName;
}
