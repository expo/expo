/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import countLines from 'metro/src/lib/countLines';
import type {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

import { wrapDevelopmentCSS } from './css';
import {
  collectCssImports,
  matchCssModule,
  printCssWarnings,
  transformCssModuleWeb,
} from './css-modules';
import * as worker from './metro-transform-worker';
import { transformPostCssModule } from './postcss';
import { compileSass, matchSass } from './sass';
import { ExpoJsOutput } from '../serializer/jsOutput';

const debug = require('debug')('expo:metro-config:transform-worker') as typeof console.log;

function getStringArray(value: any): string[] | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('Expected an array of strings for the `clientBoundaries` option.');
  }
  if (Array.isArray(value)) {
    return value;
  }
  throw new Error('Expected an array of strings for the `clientBoundaries` option.');
}

export async function transform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  const reactServer = options.customTransformOptions?.environment === 'react-server';
  if (
    typeof options.customTransformOptions?.dom === 'string' &&
    filename.match(/expo\/dom\/entry\.js/)
  ) {
    // TODO: Find some method to do this without invalidating the cache between different DOM components.
    // Inject source for DOM component entry.
    const relativeDomComponentEntry = JSON.stringify(decodeURI(options.customTransformOptions.dom));
    const src = `require('expo/dom/internal').registerDOMComponent(require(${relativeDomComponentEntry}).default);`;
    return worker.transform(config, projectRoot, filename, Buffer.from(src), options);
  }
  if (filename.match(/expo-router\/virtual-client-boundaries\.js/)) {
    const environment = options.customTransformOptions?.environment;
    const isServer = environment === 'node' || environment === 'react-server';

    if (!isServer) {
      const clientBoundaries = getStringArray(options.customTransformOptions?.clientBoundaries);
      // Inject client boundaries into the root client bundle for production bundling.
      if (clientBoundaries) {
        debug('Parsed client boundaries:', clientBoundaries);

        // Inject source
        const src =
          'module.exports = {\n' +
          clientBoundaries
            .map((boundary: string) => {
              return `[\`$\{require.resolveWeak('${boundary}')}\`]: /* ${boundary} */ () => import('${boundary}'),`;
            })
            .join('\n') +
          '\n};';

        return worker.transform(
          config,
          projectRoot,
          filename,
          Buffer.from('/* RSC client boundaries */\n' + src),
          options
        );
      } else if (!options.dev) {
        console.warn('clientBoundaries is not defined:', filename, options.customTransformOptions);
      }
    }
  }

  const isCss = options.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
  // If the file is not CSS, then use the default behavior.
  if (!isCss) {
    const environment = options.customTransformOptions?.environment;
    const isClientEnvironment = environment !== 'node' && environment !== 'react-server';
    if (
      isClientEnvironment &&
      // TODO: Ensure this works with windows.
      (filename.match(new RegExp(`^app/\\+html(\\.${options.platform})?\\.([tj]sx?|[cm]js)?$`)) ||
        // Strip +api files.
        filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/))
    ) {
      // Remove the server-only +html file and API Routes from the bundle when bundling for a client environment.
      return worker.transform(
        config,
        projectRoot,
        filename,
        !options.minify
          ? Buffer.from(
              // Use a string so this notice is visible in the bundle if the user is
              // looking for it.
              '"> The server-only file was removed from the client JS bundle by Expo CLI."'
            )
          : Buffer.from(''),
        options
      );
    }

    if (
      isClientEnvironment &&
      !filename.match(/\/node_modules\//) &&
      filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/)
    ) {
      // Clear the contents of +api files when bundling for the client.
      // This ensures that the client doesn't accidentally use the server-only +api files.
      return worker.transform(config, projectRoot, filename, Buffer.from(''), options);
    }

    return worker.transform(config, projectRoot, filename, data, options);
  }

  // If the platform is not web, then return an empty module.
  if (options.platform !== 'web') {
    const code = matchCssModule(filename) ? 'module.exports={ unstable_styles: {} };' : '';
    return worker.transform(
      config,
      projectRoot,
      filename,
      // TODO: Native CSS Modules
      Buffer.from(code),
      options
    );
  }

  let code = data.toString('utf8');

  // Apply postcss transforms
  const postcssResults = await transformPostCssModule(projectRoot, {
    src: code,
    filename,
  });

  if (postcssResults.hasPostcss) {
    code = postcssResults.src;
  }

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
        reactServer,
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
    const output: ExpoJsOutput[] = [
      {
        type: 'js/module',
        data: {
          ...jsModuleResults.output[0]?.data,

          // Append additional css metadata for static extraction.
          css: {
            code: cssCode,
            lineCount: countLines(cssCode),
            map: [],
            functionMap: null,
            // Disable caching for CSS files when postcss is enabled and has been run on the file.
            // This ensures that things like tailwind can update on every change.
            skipCache: postcssResults.hasPostcss,
            externalImports: results.externalImports,
          },
        },
      },
    ];

    return {
      dependencies: jsModuleResults.dependencies.concat(results.dependencies),
      output,
    };
  }

  // Global CSS:

  const { transform } = require('lightningcss') as typeof import('lightningcss');

  // Here we delegate bundling to lightningcss to resolve all CSS imports together.
  // TODO: Add full CSS bundling support to Metro.
  const cssResults = transform({
    filename,
    code: Buffer.from(code),
    errorRecovery: true,
    sourceMap: false,
    cssModules: false,
    projectRoot,
    minify: options.minify,
    analyzeDependencies: true,
    // @ts-expect-error: Added for testing against virtual file system.
    resolver: options._test_resolveCss,
  });

  printCssWarnings(filename, code, cssResults.warnings);

  const cssImports = collectCssImports(filename, code, cssResults.code.toString(), cssResults);
  const cssCode = cssImports.code;

  // Append additional css metadata for static extraction.
  const cssOutput: Required<ExpoJsOutput['data']['css']> = {
    code: cssCode,
    lineCount: countLines(cssCode),
    map: [],
    functionMap: null,
    // Disable caching for CSS files when postcss is enabled and has been run on the file.
    // This ensures that things like tailwind can update on every change.
    skipCache: postcssResults.hasPostcss,
    externalImports: cssImports.externalImports,
  };

  // Create a mock JS module that exports an empty object,
  // this ensures Metro dependency graph is correct.
  const jsModuleResults = await worker.transform(
    config,
    projectRoot,
    filename,
    options.dev
      ? Buffer.from(wrapDevelopmentCSS({ src: cssCode, filename, reactServer }))
      : Buffer.from(''),
    options
  );

  // In production, we export the CSS as a string and use a special type to prevent
  // it from being included in the JS bundle. We'll extract the CSS like an asset later
  // and append it to the HTML bundle.
  const output: ExpoJsOutput[] = [
    {
      type: 'js/module',
      data: {
        ...(jsModuleResults.output[0] as ExpoJsOutput).data,
        css: cssOutput,
      },
    },
  ];

  return {
    dependencies: jsModuleResults.dependencies.concat(cssImports.dependencies),
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
