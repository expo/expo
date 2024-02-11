/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as babylon from '@babel/parser';
import * as t from '@babel/types';

/** A fork of the upstream method but with the `require` rename removed since the modules already run scoped in iife. */
export function wrapModule(
  fileAst: babylon.ParseResult<t.File>,
  importDefaultName: string,
  importAllName: string,
  dependencyMapName: string,
  globalPrefix: string
) {
  // TODO: Use a cheaper transform that doesn't require AST.
  const params = buildParameters(importDefaultName, importAllName, dependencyMapName);
  const factory = functionFromProgram(fileAst.program, params);
  const def = t.callExpression(t.identifier(`${globalPrefix}__d`), [factory]);
  return t.file(t.program([t.expressionStatement(def)]));
}

function functionFromProgram(program: t.Program, parameters: string[]) {
  return t.functionExpression(
    undefined,
    parameters.map(t.identifier),
    t.blockStatement(program.body, program.directives)
  );
}

function buildParameters(
  importDefaultName: string,
  importAllName: string,
  dependencyMapName: string
): string[] {
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
