import * as babel from '@babel/core';
import { getConfig } from '@expo/config';

import { expoInlineManifestPlugin } from '../expo-inline-manifest-plugin';

jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getConfig: jest.fn(() => ({
    exp: {
      web: {
        lang: 'en',
        name: 'webName',
      },
    },
    pkg: {},
  })),
}));

function getCaller(props: Record<string, string>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

it(`inlines app manifest on web`, () => {
  const options = {
    babelrc: false,
    presets: [],
    plugins: [expoInlineManifestPlugin],
    sourceMaps: true,
    filename: '/unknown',
    configFile: false,
    compact: false,
    comments: true,
    retainLines: true,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      projectRoot: '/foo/bar',
      platform: 'ios',
    }),
  };

  // All of this code should remain intact.
  const sourceCode = `process.env.APP_MANIFEST;`;

  // Does not inline for ios
  expect(babel.transform(sourceCode, options)!.code).toEqual(sourceCode);

  // Does inline for web
  expect(
    babel.transform(sourceCode, {
      ...options,
      caller: getCaller({
        name: 'metro',
        engine: 'hermes',
        projectRoot: '/foo/bar',
        platform: 'web',
      }),
    })!.code
  ).toEqual(
    '"{\\"web\\":{\\"lang\\":\\"en\\",\\"name\\":\\"webName\\",\\"shortName\\":\\"webName\\"}}";'
  );

  expect(getConfig).toHaveBeenCalledTimes(1);
  // Ensure the caller project root is used.
  expect(getConfig).toHaveBeenCalledWith('/foo/bar', {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });
});

it(`records cache-vary dimensions when the manifest is inlined`, () => {
  const options = {
    babelrc: false,
    presets: [],
    plugins: [expoInlineManifestPlugin],
    filename: '/unknown',
    configFile: false,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      projectRoot: '/foo/bar',
      platform: 'web',
    }),
  };

  const inlined = babel.transform(`process.env.APP_MANIFEST;`, options)!;
  expect((inlined.metadata as any).cacheVary).toEqual([
    { scheme: 'expo-config', name: 'exp' },
    { scheme: 'env', name: 'APP_MANIFEST' },
  ]);

  // Nothing is recorded when the manifest is not inlined.
  const native = babel.transform(`process.env.APP_MANIFEST;`, {
    ...options,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      projectRoot: '/foo/bar',
      platform: 'ios',
    }),
  })!;
  expect((native.metadata as any).cacheVary).toBeUndefined();

  const unrelated = babel.transform(`process.env.OTHER;`, options)!;
  expect((unrelated.metadata as any).cacheVary).toBeUndefined();
});
