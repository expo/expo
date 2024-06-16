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
