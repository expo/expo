import * as babel from '@babel/core';

import preset from '..';

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

it(`transforms import.meta.url to globalThis.ExpoImportMetaRegistry.url`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true }),
  };

  const sourceCode = `var url = import.meta.url;`;
  expect(babel.transform(sourceCode, options)!.code).toMatchInlineSnapshot(
    `"var url = globalThis.ExpoImportMetaRegistry.url;"`
  );
});

it(`should not transform when enableImportMetaTransform is false`, () => {
  const options = {
    ...DEF_OPTIONS,
    presets: [[preset, { enableImportMetaTransform: false }]],
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true }),
  };

  const sourceCode = `var url = import.meta.url;`;
  expect(babel.transform(sourceCode, options)!.code).toEqual(sourceCode);
});
