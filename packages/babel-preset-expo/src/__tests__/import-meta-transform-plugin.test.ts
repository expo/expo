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

it(`should throw an error when trying to transform import.meta by default for native platforms`, () => {
  ['android', 'ios'].forEach((platform) => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform, isDev: true }),
    };

    const sourceCode = `var url = import.meta.url;`;
    expect(() => babel.transform(sourceCode, options)).toThrow(
      /`import.meta` is not supported in Hermes. Enable the polyfill `unstable_transformImportMeta` in babel-preset-expo to use this syntax./
    );
  });
});
it(`should not transform import.meta by default for web platforms`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: true }),
  };

  const sourceCode = `var url = import.meta.url;`;
  expect(babel.transform(sourceCode, options).code).toEqual(`var url = import.meta.url;`);
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
