/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as babel from './babel-core';

// TS detection conditions copied from @react-native/babel-preset
function isTypeScriptSource(fileName: string): boolean {
  return fileName?.endsWith('.ts');
}

function isTSXSource(fileName: string): boolean {
  return fileName?.endsWith('.tsx');
}

export function transformSync(
  src: string,
  babelConfig: babel.TransformOptions,
  { hermesParser }: { hermesParser?: boolean }
) {
  const useBabelCore =
    isTypeScriptSource(babelConfig.filename!) ||
    isTSXSource(babelConfig.filename!) ||
    !hermesParser;

  const parser = useBabelCore ? parseWithBabel : parseWithHermes;

  return parser(src, babelConfig);
}

function parseWithHermes(src: string, babelConfig: babel.TransformOptions) {
  const sourceAst = require('hermes-parser').parse(src, {
    babel: true,
    sourceType: babelConfig.sourceType,
  });
  return babel.transformFromAstSync(sourceAst, src, babelConfig);
}

function parseWithBabel(src: string, babelConfig: babel.TransformOptions) {
  return babel.transformSync(src, babelConfig);
}
