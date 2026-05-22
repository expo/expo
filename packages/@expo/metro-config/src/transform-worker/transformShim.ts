import { parse, type ParseResult } from '@babel/core';
import generate from '@babel/generator';
import * as JsFileWrapping from '@expo/metro/metro/ModuleGraph/worker/JsFileWrapping';
import type { JsTransformerConfig } from '@expo/metro/metro-transform-worker';

import type { TransformResponse } from './transform-worker';
import type { ExpoJsOutput } from '../serializer/jsOutput';
import { countLinesAndTerminateSourceMap, emptySourceMap } from '../serializer/packedMap';

/** Synthesizes the `metro-transform-worker` output for a hand-crafted JS shims
 *
 * Typically used to skip Babel for JS output that embeds CSS. The CSS files'
 * processing isn't cached in development, making invoking Babel on them very
 * expensive and unnecessary.
 *
 * Note that `body` must not contain requires/imports, and parse without
 * additional Babel syntax features enabled. It must also only reference
 * the default Metro module arguments or globals.
 */
export function transformShim(
  config: JsTransformerConfig,
  filename: string,
  body: string
): TransformResponse {
  const parsed = parse(body, {
    sourceType: 'unambiguous',
    babelrc: false,
    configFile: false,
    cloneInputAst: false,
  });
  if (parsed == null) {
    throw new Error(
      `transformShim could not parse the synthesized module body for ${filename}. ` +
        `This is a bug in @expo/metro-config — the shim path is only used for hand-crafted ` +
        `module bodies which should always parse with default Babel options.`
    );
  }
  const ast = parsed as ParseResult;
  const wrappedAst =
    config.unstable_disableModuleWrapping === true
      ? ast
      : JsFileWrapping.wrapModule(
          ast,
          '_$$_IMPORT_DEFAULT',
          '_$$_IMPORT_ALL',
          config.unstable_dependencyMapReservedName ?? 'dependencyMap',
          config.globalPrefix,
          config.unstable_renameRequire === false
        ).ast;

  const { code } = generate(wrappedAst, {
    comments: false,
    compact: config.unstable_compactOutput ?? false,
    filename,
    retainLines: false,
    sourceMaps: false,
  });

  const map = emptySourceMap();
  const { lineCount } = countLinesAndTerminateSourceMap(code, map);
  const output: ExpoJsOutput[] = [
    {
      type: 'js/module',
      data: { code, functionMap: null, lineCount, map },
    },
  ];
  return { dependencies: [], output };
}
