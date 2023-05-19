/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { FBSourceFunctionMap } from 'metro-source-map';
import worker, {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

import { wrapDevelopmentCSS } from './css';
import { matchCssModule, transformCssModuleWeb } from './css-modules';
import { transformPostCssModule } from './postcss';
import { compileSass, matchSass } from './sass';
// import { compileSass, matchSass } from "./sass";

const countLines = require('metro/src/lib/countLines') as (string: string) => number;

type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';

type JsOutput = {
  data: {
    code: string;
    lineCount: number;
    map: any[];
    functionMap: FBSourceFunctionMap | null;
  };
  type: JSFileType;
};

export async function webCssTransform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  let code = data.toString('utf8');

  // Apply postcss transforms
  code = await transformPostCssModule(projectRoot, {
    src: code,
    filename,
  });

  // TODO: When native has CSS support, this will need to move higher up.
  const syntax = matchSass(filename);
  if (syntax) {
    code = compileSass(projectRoot, { filename, src: code }, { syntax }).src;
  }

  // If the file is a CSS Module, then transform it to a JS module
  // in development and a static CSS file in production.
  if (matchCssModule(filename)) {
    const results = await transformCssModuleWeb({
      filename,
      src: code,
      options: {
        projectRoot,
        dev: options.dev,
        minify: options.minify,
        sourceMap: false,
      },
    });

    const jsModuleResults = await worker.transform(
      config,
      projectRoot,
      filename,
      Buffer.from(results.output),
      options
    );

    const cssCode = results.css.toString();
    const output: JsOutput[] = [
      {
        type: 'js/module',
        data: {
          // @ts-expect-error
          ...jsModuleResults.output[0]?.data,

          // Append additional css metadata for static extraction.
          css: {
            code: cssCode,
            lineCount: countLines(cssCode),
            map: [],
            functionMap: null,
          },
        },
      },
    ];

    return {
      dependencies: jsModuleResults.dependencies,
      output,
    };
  }

  // Global CSS:

  const { transform } = await import('lightningcss');

  // TODO: Add bundling to resolve imports
  // https://lightningcss.dev/bundling.html#bundling-order

  const cssResults = transform({
    filename,
    code: Buffer.from(code),
    sourceMap: false,
    cssModules: false,
    projectRoot,
    minify: options.minify,
  });

  // TODO: Warnings:
  // cssResults.warnings.forEach((warning) => {
  // });

  // Create a mock JS module that exports an empty object,
  // this ensures Metro dependency graph is correct.
  const jsModuleResults = await worker.transform(
    config,
    projectRoot,
    filename,
    options.dev ? Buffer.from(wrapDevelopmentCSS({ src: code, filename })) : Buffer.from(''),
    options
  );

  const cssCode = cssResults.code.toString();

  // In production, we export the CSS as a string and use a special type to prevent
  // it from being included in the JS bundle. We'll extract the CSS like an asset later
  // and append it to the HTML bundle.
  const output: JsOutput[] = [
    {
      type: 'js/module',
      data: {
        // @ts-expect-error
        ...jsModuleResults.output[0]?.data,

        // Append additional css metadata for static extraction.
        css: {
          code: cssCode,
          lineCount: countLines(cssCode),
          map: [],
          functionMap: null,
        },
      },
    },
  ];

  return {
    dependencies: jsModuleResults.dependencies,
    output,
  };
}
