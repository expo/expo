import * as babel from '@babel/core';
import { runInNewContext } from 'node:vm';

import preset from '../..';
import { expoImportMetaTransformPluginFactory } from '../import-meta-transform-plugin';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',
  babelrc: false,
  presets: [preset],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: true,
  caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios' }),
};

it(`transforms import.meta.url to globalThis.__ExpoImportMetaRegistry.url when unstable_transformImportMeta is true`, () => {
  const options = {
    ...DEF_OPTIONS,
    presets: [[preset, { unstable_transformImportMeta: true }]],
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true }),
  };

  const sourceCode = `var url = import.meta.url;`;
  expect(babel.transform(sourceCode, options)!.code).toMatchInlineSnapshot(
    `"var url = globalThis.__ExpoImportMetaRegistry.url;"`
  );
});

it(`should transform import.meta by default for web platforms`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: true }),
  };

  const sourceCode = `var url = import.meta.url;`;
  expect(babel.transform(sourceCode, options)!.code).toEqual(
    `var url = globalThis.__ExpoImportMetaRegistry.url;`
  );
});

it(`should transform import.meta by default for server bundles`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      platform: 'web',
      isDev: true,
      isServer: true,
    }),
  };

  const sourceCode = `var url = import.meta.url;`;
  expect(babel.transform(sourceCode, options)!.code).toEqual(
    `var url = globalThis.__ExpoImportMetaRegistry.url;`
  );
});

it.each([
  { name: 'native', platform: 'ios', isServer: false, transformImportMeta: undefined },
  { name: 'server', platform: 'web', isServer: true, transformImportMeta: undefined },
  { name: 'transform disabled', platform: 'web', isServer: false, transformImportMeta: false },
])(
  'transforms import.meta.url under Jest ($name)',
  ({ platform, isServer, transformImportMeta }) => {
    const { code } = babel.transform(`globalThis.result = import.meta.url;`, {
      ...DEF_OPTIONS,
      presets: [[preset, { transformImportMeta }]],
      caller: getCaller({
        name: 'metro',
        engine: 'hermes',
        platform,
        isDev: true,
        isServer,
        bundler: 'jest',
      }),
    })!;
    const context = { result: undefined };
    runInNewContext(code!, context);
    expect(context.result).toBe('file:///unknown');
  }
);

it(`uses null under Jest when Babel has no filename`, () => {
  const { code } = babel.transform(`globalThis.result = import.meta.url;`, {
    ...DEF_OPTIONS,
    filename: undefined,
    // Test the plugin directly: other preset plugins require a filename.
    presets: [],
    plugins: [expoImportMetaTransformPluginFactory(true)],
    caller: getCaller({ name: 'metro', bundler: 'jest', platform: 'ios' }),
  })!;
  const context = { result: undefined };
  runInNewContext(code!, context);
  expect(context.result).toBeNull();
});

it(`uses Babel's filename without capturing local bindings under Jest`, () => {
  const sourceCode = `
    import { fileURLToPath } from 'node:url';
    const __filename = fileURLToPath(import.meta.url);
    globalThis.result = __filename;
  `;
  const { code } = babel.transform(sourceCode, {
    ...DEF_OPTIONS,
    filename: '/path with spaces/file#name.ts',
    caller: getCaller({ name: 'metro', bundler: 'jest', platform: 'ios', isDev: true }),
  })!;
  const context = { require, result: undefined };
  runInNewContext(code!, context);
  expect(context.result).toBe('/path with spaces/file#name.ts');
});
