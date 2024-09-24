/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the Metro transformer worker, but with additional transforms moved to `babel-preset-expo` and modifications made for web support.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/index.js#L1
 */

import { TraceMap, originalPositionFor, generatedPositionFor } from '@jridgewell/trace-mapping';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { vol } from 'memfs';
import { fromRawMappings } from 'metro-source-map';
import type { JsTransformerConfig, JsTransformOptions, JsOutput } from 'metro-transform-worker';
import * as path from 'path';

/** Converts source mappings from Metro to a “TraceMap”, which is similar to source-map’s SourceMapConsumer */
const toTraceMap = (output: JsOutput, contents: string) => {
  const map = fromRawMappings([output.data]).toMap();
  return new TraceMap({
    ...map,
    file: output.data.code,
    sources: [null],
    sourcesContent: [contents || null],
  });
};

const originalWarn = console.warn;

beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

jest
  .mock('metro-transform-worker/src/utils/getMinifier', () => () => ({ code, map, config }) => {
    const trimmed = config.output.comments ? code : code.replace('/*#__PURE__*/', '');
    return {
      code: trimmed.replace('arbitrary(code)', 'minified(code)'),
      map,
    };
  })
  .mock('metro-transform-plugins', () => ({
    ...jest.requireActual('metro-transform-plugins'),
    inlinePlugin: () => ({}),
    constantFoldingPlugin: () => ({}),
  }))
  .mock('metro-minify-terser');

const babelTransformerPath = require.resolve('@expo/metro-config/babel-transformer');

const transformerContents = jest.requireActual('fs').readFileSync(babelTransformerPath);

const HEADER_DEV =
  '__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {';
const HEADER_PROD = '__d(function (g, r, i, a, m, e, d) {';

// let fs: typeof import('fs');
let Transformer: typeof import('../metro-transform-worker');

const baseConfig: JsTransformerConfig = {
  allowOptionalDependencies: false,
  assetPlugins: [],
  assetRegistryPath: '',
  asyncRequireModulePath: 'asyncRequire',
  babelTransformerPath,
  dynamicDepsInPackages: 'reject',
  enableBabelRCLookup: false,
  enableBabelRuntime: true,
  globalPrefix: '',
  hermesParser: false,
  minifierConfig: { output: { comments: false } },
  minifierPath: 'minifyModulePath',
  optimizationSizeLimit: 100000,
  publicPath: '/assets',
  unstable_dependencyMapReservedName: null,
  unstable_compactOutput: false,
  unstable_disableModuleWrapping: false,
  unstable_disableNormalizePseudoGlobals: false,
  unstable_allowRequireContext: false,
};

const baseTransformOptions: JsTransformOptions = {
  dev: true,
  hot: false,
  inlinePlatform: false,
  inlineRequires: false,
  minify: false,
  platform: 'ios',
  type: 'module',
  unstable_transformProfile: 'default',
  customTransformOptions: {
    __proto__: null,
  },
};

jest.mock('fs');

beforeEach(() => {
  jest.resetModules();

  //   jest.mock('fs', () => new (require('metro-memory-fs'))());

  //   fs = require('fs');
  Transformer = require('../metro-transform-worker');

  vol.reset();

  fs.mkdirSync('/root/local', { recursive: true });
  fs.mkdirSync(path.dirname(babelTransformerPath), { recursive: true });
  fs.writeFileSync(babelTransformerPath, transformerContents);
});

it('transforms a simple script', async () => {
  const contents = 'someReallyArbitrary(code)';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    { ...baseTransformOptions, type: 'script' }
  );

  expect(result.output[0].type).toBe('js/script');
  expect(result.output[0].data.code).toBe(
    [
      '(function (global) {',
      '  someReallyArbitrary(code);',
      "})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);",
    ].join('\n')
  );

  const trace = toTraceMap(result.output[0], contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 0 })).toMatchObject({
    line: 2,
    column: 2,
  });

  expect(originalPositionFor(trace, { line: 2, column: 2 })).toMatchObject({
    line: 1,
    column: 0,
    name: 'someReallyArbitrary',
  });

  // NOTE: If downgraded below @babel/generator@7.21.0, names will be missing here
  expect(originalPositionFor(trace, { line: 3, column: 10 })).toMatchObject({
    line: 1,
    column: 25,
    name: 'globalThis',
  });
  expect(originalPositionFor(trace, { line: 3, column: 59 })).toMatchObject({
    line: 1,
    column: 25,
    name: 'global',
  });
  expect(originalPositionFor(trace, { line: 3, column: 100 })).toMatchObject({
    line: 1,
    column: 25,
    name: 'window',
  });

  expect(result.output[0].data.functionMap).toMatchSnapshot();
  expect(result.dependencies).toEqual([]);
});

it('transforms a simple module', async () => {
  const contents = 'arbitrary(code)';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  const trace = toTraceMap(result.output[0], contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 0 })).toMatchObject({
    line: 2,
    column: 2,
  });
  expect(generatedPositionFor(trace, { source: '', line: 1, column: 10 })).toMatchObject({
    line: 2,
    column: 12,
  });

  expect(originalPositionFor(trace, { line: 2, column: 2 })).toMatchObject({
    line: 1,
    column: 0,
    name: 'arbitrary',
  });
  expect(originalPositionFor(trace, { line: 2, column: 12 })).toMatchObject({
    line: 1,
    column: 10,
    name: 'code',
  });

  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.code).toBe([HEADER_DEV, '  arbitrary(code);', '});'].join('\n'));
  expect(result.output[0].data.functionMap).toMatchSnapshot();
  expect(result.dependencies).toEqual([]);
});

it('transforms a module with dependencies', async () => {
  const contents = [
    '"use strict";',
    'require("./a");',
    'arbitrary(code);',
    'const b = require("b");',
    'import c from "./c";',
  ].join('\n');

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.code).toBe(
    [
      HEADER_DEV,
      '  "use strict";',
      '',
      '  var _interopRequireDefault = _$$_REQUIRE(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");',
      '  var _c = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[1], "./c"));',
      '  _$$_REQUIRE(_dependencyMap[2], "./a");',
      '  arbitrary(code);',
      '  var b = _$$_REQUIRE(_dependencyMap[3], "b");',
      '});',
    ].join('\n')
  );

  const trace = toTraceMap(result.output[0], contents);

  expect(
    generatedPositionFor(trace, { source: '', line: 2, column: 0 } /* require("./a") */)
  ).toMatchObject({ line: 6, column: 2 });

  expect(originalPositionFor(trace, { line: 7, column: 2 })).toMatchObject({
    line: 3,
    column: 0,
    name: 'arbitrary',
  });
  expect(originalPositionFor(trace, { line: 8, column: 6 })).toMatchObject({
    line: 4,
    column: 6,
    name: 'b',
  });
  expect(originalPositionFor(trace, { line: 8, column: 6 })).toMatchObject({
    line: 4,
    column: 6,
    name: 'b',
  });

  // NOTE: If downgraded below @babel/generator@7.21.0, names will be missing here
  expect(originalPositionFor(trace, { line: 5, column: 6 })).toMatchObject({
    line: 5,
    column: 0,
    name: '_c',
  });
  expect(originalPositionFor(trace, { line: 4, column: 6 })).toMatchObject({
    line: 1,
    column: 13,
    name: '_interopRequireDefault',
  });
  expect(originalPositionFor(trace, { line: 4, column: 31 })).toMatchObject({
    line: 1,
    column: 13,
    name: '_$$_REQUIRE',
  });
  expect(originalPositionFor(trace, { line: 4, column: 43 })).toMatchObject({
    line: 1,
    column: 13,
    name: '_dependencyMap',
  });

  expect(result.output[0].data.functionMap).toMatchSnapshot();

  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/interopRequireDefault',
    },
    { data: expect.objectContaining({ asyncType: null }), name: './c' },
    { data: expect.objectContaining({ asyncType: null }), name: './a' },
    { data: expect.objectContaining({ asyncType: null }), name: 'b' },
  ]);
});

it('transforms an es module with asyncToGenerator', async () => {
  const contents = 'export async function test() {}';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.code).toMatchSnapshot();

  const trace = toTraceMap(result.output[0], contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 12 })).toMatchObject({
    line: 12,
    column: 44,
  });

  expect(originalPositionFor(trace, { line: 8, column: 11 })).toMatchObject({
    line: 1,
    column: 22,
    name: 'test',
  });

  expect(result.output[0].data.functionMap).toMatchSnapshot();

  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/interopRequireDefault',
    },
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/asyncToGenerator',
    },
  ]);
});

it('transforms async generators', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('export async function* test() { yield "ok"; }', 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0].data.code).toMatchSnapshot();
  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/interopRequireDefault',
    },
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/awaitAsyncGenerator',
    },
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/wrapAsyncGenerator',
    },
  ]);
});

it('transforms import/export syntax when experimental flag is on', async () => {
  const contents = ['import c from "./c";'].join('\n');

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    { ...baseTransformOptions, experimentalImportSupport: true }
  );

  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.code).toBe(
    [
      HEADER_DEV,
      '  "use strict";',
      '',
      '  var c = _$$_IMPORT_DEFAULT(_dependencyMap[0], "./c");',
      '});',
    ].join('\n')
  );

  const trace = toTraceMap(result.output[0], contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 7 })).toMatchObject({
    line: 4,
    column: 6,
  });

  expect(originalPositionFor(trace, { line: 4, column: 6 })).toMatchObject({
    line: 1,
    column: 7,
    name: 'c',
  });

  // NOTE: If downgraded below @babel/generator@7.21.0, names will be missing here
  expect(originalPositionFor(trace, { line: 4, column: 10 })).toMatchObject({
    line: 1,
    column: 8,
    name: '_$$_IMPORT_DEFAULT',
  });
  expect(originalPositionFor(trace, { line: 4, column: 29 })).toMatchObject({
    line: 1,
    column: 8,
    name: '_dependencyMap',
  });

  expect(result.output[0].data.functionMap).toMatchSnapshot();

  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({
        asyncType: null,
      }),
      name: './c',
    },
  ]);
});

it('does not add "use strict" on non-modules', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'node_modules/local/file.js',
    Buffer.from('module.exports = {};', 'utf8'),
    { ...baseTransformOptions, experimentalImportSupport: true }
  );

  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.code).toBe([HEADER_DEV, '  module.exports = {};', '});'].join('\n'));
});

it('preserves require() calls when module wrapping is disabled', async () => {
  const contents = ['require("./c");'].join('\n');

  const result = await Transformer.transform(
    {
      ...baseConfig,
      unstable_disableModuleWrapping: true,
    },
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.code).toBe('require("./c");');
});

it('reports filename when encountering unsupported dynamic dependency', async () => {
  const contents = ['require("./a");', 'let a = arbitrary(code);', 'const b = require(a);'].join(
    '\n'
  );

  try {
    await Transformer.transform(
      baseConfig,
      '/root',
      'local/file.js',
      Buffer.from(contents, 'utf8'),
      baseTransformOptions
    );
    throw new Error('should not reach this');
  } catch (error) {
    expect(error.message).toMatchSnapshot();
  }
});

it('supports dynamic dependencies from within `node_modules`', async () => {
  expect(
    (
      await Transformer.transform(
        {
          ...baseConfig,
          dynamicDepsInPackages: 'throwAtRuntime',
        },
        '/root',
        'node_modules/foo/bar.js',
        Buffer.from('require(foo.bar);', 'utf8'),
        baseTransformOptions
      )
    ).output[0].data.code
  ).toBe(
    [
      HEADER_DEV,
      '  (function (line) {',
      "    throw new Error('Dynamic require defined at line ' + line + '; not supported by Metro');",
      '  })(1);',
      '});',
    ].join('\n')
  );
});

it('minifies the code correctly', async () => {
  expect(
    (
      await Transformer.transform(
        baseConfig,
        '/root',
        'local/file.js',
        Buffer.from('arbitrary(code);', 'utf8'),
        { ...baseTransformOptions, minify: true }
      )
    ).output[0].data.code
  ).toBe([HEADER_PROD, '  minified(code);', '});'].join('\n'));
});

it('minifies a JSON file', async () => {
  expect(
    (
      await Transformer.transform(
        baseConfig,
        '/root',
        'local/file.json',
        Buffer.from('arbitrary(code);', 'utf8'),
        { ...baseTransformOptions, minify: true }
      )
    ).output[0].data.code
  ).toBe(
    [
      '__d(function(global, require, _importDefaultUnused, _importAllUnused, module, exports, _dependencyMapUnused) {',
      '  module.exports = minified(code);;',
      '});',
    ].join('\n')
  );
});

it('does not wrap a JSON file when disableModuleWrapping is enabled', async () => {
  expect(
    (
      await Transformer.transform(
        {
          ...baseConfig,
          unstable_disableModuleWrapping: true,
        },
        '/root',
        'local/file.json',
        Buffer.from('arbitrary(code);', 'utf8'),
        baseTransformOptions
      )
    ).output[0].data.code
  ).toBe('module.exports = arbitrary(code);;');
});

it('uses a reserved dependency map name and prevents it from being minified', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, unstable_dependencyMapReservedName: 'THE_DEP_MAP' },
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, THE_DEP_MAP) {
      minified(code);
    });"
  `);
});

it('throws if the reserved dependency map name appears in the input', async () => {
  await expect(
    Transformer.transform(
      { ...baseConfig, unstable_dependencyMapReservedName: 'THE_DEP_MAP' },
      '/root',
      'local/file.js',
      Buffer.from(
        'arbitrary(code); /* the code is not allowed to mention THE_DEP_MAP, even in a comment */',
        'utf8'
      ),
      { ...baseTransformOptions, dev: false, minify: true }
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Source code contains the reserved string \`THE_DEP_MAP\` at character offset 55"`
  );
});

it('allows disabling the normalizePseudoGlobals pass when minifying', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, unstable_disableNormalizePseudoGlobals: true },
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      minified(code);
    });"
  `);
});

it('allows emitting compact code when not minifying', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, unstable_compactOutput: true },
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: false }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(
    `"__d(function(global,_$$_REQUIRE,_$$_IMPORT_DEFAULT,_$$_IMPORT_ALL,module,exports,_dependencyMap){arbitrary(code);});"`
  );
});

it('skips minification in Hermes stable transform profile', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      unstable_transformProfile: 'hermes-canary',
      customTransformOptions: { __proto__: null, bytecode: '1' },
    }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      arbitrary(code);
    });"
  `);
});

it('skips minification in Hermes canary transform profile', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      unstable_transformProfile: 'hermes-canary',
      customTransformOptions: { __proto__: null, bytecode: '1' },
    }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      arbitrary(code);
    });"
  `);
});

it('minifies with Hermes transform profile if bytecode is disabled', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      unstable_transformProfile: 'hermes-canary',
    }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, d) {
      minified(code);
    });"
  `);
});

it('counts all line endings correctly', async () => {
  const transformStr = (str: string) =>
    Transformer.transform(baseConfig, '/root', 'local/file.js', Buffer.from(str, 'utf8'), {
      ...baseTransformOptions,
      dev: false,
      minify: false,
    });

  const differentEndingsResult = await transformStr('one\rtwo\r\nthree\nfour\u2028five\u2029six');

  const standardEndingsResult = await transformStr('one\ntwo\nthree\nfour\nfive\nsix');

  expect(differentEndingsResult.output[0].data.lineCount).toEqual(
    standardEndingsResult.output[0].data.lineCount
  );
});

it('outputs comments when `minify: false`', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('/*#__PURE__*/arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: false }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
      /*#__PURE__*/arbitrary(code);
    });"
  `);
});

it('omits comments when `minify: true`', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('/*#__PURE__*/arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, d) {
      minified(code);
    });"
  `);
});

it('allows outputting comments when `minify: true`', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, minifierConfig: { output: { comments: true } } },
    '/root',
    'local/file.js',
    Buffer.from('/*#__PURE__*/arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0].data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, d) {
      /*#__PURE__*/minified(code);
    });"
  `);
});

it('allows the constantFoldingPlugin to not remove used helpers when `dev: false`', async () => {
  // NOTE(kitten): The `constantFoldingPlugin` removes used, inlined Babel helpers, unless
  // the AST path has been re-crawled. If this regressed, check whether `programPath.scope.crawl()`
  // is called before this plugin is run.
  jest.mock('metro-transform-plugins', () => ({
    ...jest.requireActual('metro-transform-plugins'),
    inlinePlugin: () => ({}),
    constantFoldingPlugin: jest.requireActual('metro-transform-plugins').constantFoldingPlugin,
  }));

  const contents = ['import * as test from "test-module";', 'export { test };'].join('\n');

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    { ...baseTransformOptions, dev: false }
  );
  expect(result.output[0].data.code).toMatchSnapshot();
});
