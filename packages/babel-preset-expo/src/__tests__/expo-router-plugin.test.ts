import * as babel from '@babel/core';
import { getConfig } from '@expo/config';

import { expoRouterBabelPlugin } from '../expo-router-plugin';

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

jest.mock('resolve-from', () => ({
  __esModule: true,
  default: jest.fn(() => '/foo/bar/node_modules/entry.js'),
}));

function getCaller(props: Record<string, string>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

beforeEach(() => {
  process.env._EXPO_INTERNAL_TESTING = '1';
  delete process.env.EXPO_ROUTER_ABS_APP_ROOT;
  delete process.env.EXPO_ROUTER_IMPORT_MODE_IOS;
  delete process.env.EXPO_ROUTER_IMPORT_MODE_ANDROID;
  delete process.env.EXPO_ROUTER_IMPORT_MODE_WEB;
  delete process.env.EXPO_PROJECT_ROOT;
});

afterEach(() => {
  delete process.env._EXPO_INTERNAL_TESTING;
  process.env.NODE_ENV = 'test';
});

it(`inlines static mode`, () => {
  jest.mocked(getConfig).mockClear();
  process.env.NODE_ENV = 'development';
  const options = {
    babelrc: false,
    presets: [],
    plugins: [expoRouterBabelPlugin],
    sourceMaps: true,
    configFile: false,
    filename: '/unknown',
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
  const sourceCode = `
// EXPO_ROUTER_IMPORT_MODE_IOS
process.env.EXPO_ROUTER_IMPORT_MODE_IOS;
// EXPO_ROUTER_IMPORT_MODE_ANDROID
process.env.EXPO_ROUTER_IMPORT_MODE_ANDROID;
// EXPO_ROUTER_IMPORT_MODE_WEB
process.env.EXPO_ROUTER_IMPORT_MODE_WEB;
  `;

  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_ROUTER_IMPORT_MODE_IOS
"sync";
// EXPO_ROUTER_IMPORT_MODE_ANDROID
process.env.EXPO_ROUTER_IMPORT_MODE_ANDROID;
// EXPO_ROUTER_IMPORT_MODE_WEB
process.env.EXPO_ROUTER_IMPORT_MODE_WEB;`);

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
  ).toEqual(`
// EXPO_ROUTER_IMPORT_MODE_IOS
process.env.EXPO_ROUTER_IMPORT_MODE_IOS;
// EXPO_ROUTER_IMPORT_MODE_ANDROID
process.env.EXPO_ROUTER_IMPORT_MODE_ANDROID;
// EXPO_ROUTER_IMPORT_MODE_WEB
"sync";`);

  expect(
    babel.transform(sourceCode, {
      ...options,
      caller: getCaller({
        name: 'metro',
        engine: 'hermes',
        projectRoot: '/foo/bar',
        platform: 'android',
      }),
    })!.code
  ).toEqual(`
// EXPO_ROUTER_IMPORT_MODE_IOS
process.env.EXPO_ROUTER_IMPORT_MODE_IOS;
// EXPO_ROUTER_IMPORT_MODE_ANDROID
"sync";
// EXPO_ROUTER_IMPORT_MODE_WEB
process.env.EXPO_ROUTER_IMPORT_MODE_WEB;`);

  expect(getConfig).toHaveBeenCalledTimes(3);
  // Ensure the caller project root is used.
  expect(getConfig).toHaveBeenCalledWith('/foo/bar');
});

it(`inlines constants`, () => {
  process.env.NODE_ENV = 'development';
  const options = {
    babelrc: false,
    presets: [],
    plugins: [expoRouterBabelPlugin],
    sourceMaps: true,
    filename: 'unknown',
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
  const sourceCode = `
// EXPO_PROJECT_ROOT
process.env.EXPO_PROJECT_ROOT;
// EXPO_PUBLIC_USE_STATIC
process.env.EXPO_PUBLIC_USE_STATIC;
// EXPO_ROUTER_ABS_APP_ROOT
process.env.EXPO_ROUTER_ABS_APP_ROOT;
// EXPO_ROUTER_APP_ROOT
process.env.EXPO_ROUTER_APP_ROOT;`;

  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_PROJECT_ROOT
"/foo/bar";
// EXPO_PUBLIC_USE_STATIC
false;
// EXPO_ROUTER_ABS_APP_ROOT
"/foo/bar/app";
// EXPO_ROUTER_APP_ROOT
"../app";`);
});

it(`uses custom app entry`, () => {
  jest
    .mocked(getConfig)
    .mockClear()
    .mockReturnValueOnce({
      pkg: {},
      dynamicConfigObjectType: '',
      dynamicConfigPath: '',
      rootConfig: { expo: { slug: '...', name: '...' } },
      staticConfigPath: '',
      exp: {
        name: '...',
        slug: '...',
        extra: {
          router: { unstable_src: '/random/value' },
        },
      },
    });

  process.env.NODE_ENV = 'development';

  const options = {
    babelrc: false,
    presets: [],
    plugins: [expoRouterBabelPlugin],
    sourceMaps: true,
    filename: 'unknown',
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
  const sourceCode = `
// EXPO_PROJECT_ROOT
process.env.EXPO_PROJECT_ROOT;
// EXPO_ROUTER_ABS_APP_ROOT
process.env.EXPO_ROUTER_ABS_APP_ROOT;
// EXPO_ROUTER_APP_ROOT
process.env.EXPO_ROUTER_APP_ROOT;`;

  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_PROJECT_ROOT
"/foo/bar";
// EXPO_ROUTER_ABS_APP_ROOT
"/random/value";
// EXPO_ROUTER_APP_ROOT
"../../../random/value";`);
});
