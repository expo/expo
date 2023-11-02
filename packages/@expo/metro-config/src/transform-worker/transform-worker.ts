/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from 'metro-source-map';
import worker, {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

import { wrapDevelopmentCSS } from './css';
import { matchCssModule, transformCssModuleWeb } from './css-modules';
import { transformPostCssModule } from './postcss';
import { compileSass, matchSass } from './sass';
import { env } from '../env';

const countLines = require('metro/src/lib/countLines') as (string: string) => number;

type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';

type JsOutput = {
  data: {
    code: string;
    lineCount: number;
    map: MetroSourceMapSegmentTuple[];
    functionMap: FBSourceFunctionMap | null;
  };
  type: JSFileType;
};

export async function transform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  const nextConfig = {
    ...config,
  };

  const nextOptions = {
    ...options,
  };
  // Preserve the original format as much as we can for tree-shaking.
  if (env.EXPO_USE_TREE_SHAKING && !nextOptions.dev) {
    nextConfig.unstable_disableModuleWrapping = true;
    nextOptions.experimentalImportSupport = false;
    nextOptions.minify = false;
  }

  const isCss = nextOptions.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
  // If the file is not CSS, then use the default behavior.
  if (!isCss) {
    const environment = nextOptions.customTransformOptions?.environment;

    if (
      environment !== 'node' &&
      // TODO: Ensure this works with windows.
      (filename.match(
        new RegExp(`^app/\\+html(\\.${nextOptions.platform})?\\.([tj]sx?|[cm]js)?$`)
      ) ||
        // Strip +api files.
        filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/))
    ) {
      // Remove the server-only +html file and API Routes from the bundle when bundling for a client environment.
      return worker.transform(
        nextConfig,
        projectRoot,
        filename,
        !nextOptions.minify
          ? Buffer.from(
              // Use a string so this notice is visible in the bundle if the user is
              // looking for it.
              '"> The server-only file was removed from the client JS bundle by Expo CLI."'
            )
          : Buffer.from(''),
        nextOptions
      );
    }

    if (
      environment !== 'node' &&
      !filename.match(/\/node_modules\//) &&
      filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/)
    ) {
      // Clear the contents of +api files when bundling for the client.
      // This ensures that the client doesn't accidentally use the server-only +api files.
      return worker.transform(nextConfig, projectRoot, filename, Buffer.from(''), nextOptions);
    }

    return worker.transform(nextConfig, projectRoot, filename, data, nextOptions);
  }

  // If the platform is not web, then return an empty module.
  if (nextOptions.platform !== 'web') {
    const code = matchCssModule(filename) ? 'module.exports={ unstable_styles: {} };' : '';
    return worker.transform(
      nextConfig,
      projectRoot,
      filename,
      // TODO: Native CSS Modules
      Buffer.from(code),
      nextOptions
    );
  }

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
        dev: nextOptions.dev,
        minify: nextOptions.minify,
        sourceMap: false,
      },
    });

    const jsModuleResults = await worker.transform(
      nextConfig,
      projectRoot,
      filename,
      Buffer.from(results.output),
      nextOptions
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

  const { transform } = require('lightningcss') as typeof import('lightningcss');

  // TODO: Add bundling to resolve imports
  // https://lightningcss.dev/bundling.html#bundling-order

  const cssResults = transform({
    filename,
    code: Buffer.from(code),
    sourceMap: false,
    cssModules: false,
    projectRoot,
    minify: nextOptions.minify,
  });

  // TODO: Warnings:
  // cssResults.warnings.forEach((warning) => {
  // });

  // Create a mock JS module that exports an empty object,
  // this ensures Metro dependency graph is correct.
  const jsModuleResults = await worker.transform(
    nextConfig,
    projectRoot,
    filename,
    nextOptions.dev ? Buffer.from(wrapDevelopmentCSS({ src: code, filename })) : Buffer.from(''),
    nextOptions
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

/**
 * A custom Metro transformer that adds support for processing Expo-specific bundler features.
 * - Global CSS files on web.
 * - CSS Modules on web.
 * - TODO: Tailwind CSS on web.
 */
module.exports = {
  // Use defaults for everything that's not custom.
  ...worker,
  transform,
};
