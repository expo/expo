import type { JsTransformerConfig } from '@expo/metro/metro-transform-worker';

import { transformShim } from '../transformShim';

const baseConfig: JsTransformerConfig = {
  globalPrefix: '',
  unstable_compactOutput: false,
  unstable_disableModuleWrapping: false,
} as unknown as JsTransformerConfig;

it(`wraps an empty body as an empty Metro module factory`, () => {
  const result = transformShim(baseConfig, '/acme.css', '');
  expect(result.dependencies).toEqual([]);
  expect(result.output).toHaveLength(1);
  expect(result.output[0].type).toBe('js/module');
  expect(result.output[0].data.functionMap).toBeNull();
  expect(result.output[0].data.map).toEqual({
    __version: 1,
    __count: 0,
    __names: [],
    __packed: [],
  });
  // The body is empty, so the factory body is empty too.
  expect(result.output[0].data.code).toMatchInlineSnapshot(
    `"__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {});"`
  );
  expect(result.output[0].data.lineCount).toBe(1);
});

it(`wraps a CSS Module body as a Metro module factory`, () => {
  const body = 'module.exports={ unstable_styles: {} };';
  const result = transformShim(baseConfig, '/acme.module.css', body);
  expect(result.output[0].data.code).toContain('unstable_styles');
  expect(result.output[0].data.code).toMatch(/^__d\(function/);
});

it(`respects globalPrefix`, () => {
  const result = transformShim(
    { ...baseConfig, globalPrefix: '__expo__' } as JsTransformerConfig,
    '/acme.css',
    ''
  );
  expect(result.output[0].data.code).toMatch(/^__expo____d\(function/);
});

it(`emits unwrapped output when unstable_disableModuleWrapping is set`, () => {
  const result = transformShim(
    { ...baseConfig, unstable_disableModuleWrapping: true } as JsTransformerConfig,
    '/acme.css',
    'module.exports = {};'
  );
  expect(result.output[0].data.code).not.toMatch(/^__d\(/);
  expect(result.output[0].data.code).toBe('module.exports = {};');
});

it(`emits compact output when unstable_compactOutput is set`, () => {
  const body = 'module.exports = { a: 1, b: 2 };';
  const verbose = transformShim(baseConfig, '/acme.css', body);
  const compact = transformShim(
    { ...baseConfig, unstable_compactOutput: true } as JsTransformerConfig,
    '/acme.css',
    body
  );
  expect(compact.output[0].data.code.length).toBeLessThan(verbose.output[0].data.code.length);
});

it(`names the dependency map parameter from config when provided`, () => {
  const result = transformShim(
    { ...baseConfig, unstable_dependencyMapReservedName: '__depMap' } as JsTransformerConfig,
    '/acme.css',
    ''
  );
  expect(result.output[0].data.code).toContain('__depMap');
});

it(`skips renaming \`require\` when unstable_renameRequire is false`, () => {
  // With renaming disabled, the wrapper's `require` parameter keeps its name.
  const result = transformShim(
    { ...baseConfig, unstable_renameRequire: false } as JsTransformerConfig,
    '/acme.css',
    ''
  );
  // The default path renames `require` to `_$$_REQUIRE` (see the empty-body
  // snapshot above); with renaming disabled the parameter stays `require`.
  expect(result.output[0].data.code).toContain('global, require');
  expect(result.output[0].data.code).not.toContain('_$$_REQUIRE');
});

it(`counts lines correctly for multi-line bodies`, () => {
  const body = 'var a = 1;\nvar b = 2;\nvar c = 3;';
  const result = transformShim(baseConfig, '/acme.css', body);
  // Two extra lines from the wrapper open/close plus the three body lines.
  expect(result.output[0].data.lineCount).toBeGreaterThanOrEqual(3);
});
