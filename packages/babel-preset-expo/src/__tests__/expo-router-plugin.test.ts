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
  delete process.env.EXPO_ROUTER_APP_ROOT_2;
  delete process.env.EXPO_ROUTER_IMPORT_MODE;
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
process.env.EXPO_ROUTER_IMPORT_MODE;
export default process.env.EXPO_ROUTER_IMPORT_MODE;
const mode = process.env.EXPO_ROUTER_IMPORT_MODE;
  `;

  expect(babel.transform(sourceCode, options)!.code).toEqual(`
\"sync\";
export default \"sync\";
const mode = \"sync\";`);

  expect(getConfig).toHaveBeenCalledTimes(0);
});

it(`inlines static mode reassignment`, () => {
  jest
    .mocked(getConfig)
    .mockClear()
    .mockReturnValueOnce({
      exp: {
        extra: {
          router: {
            asyncRoutes: true,
          },
        },
      },
    });
  process.env.NODE_ENV = 'production';
  const options = {
    babelrc: false,
    presets: [],
    plugins: [expoRouterBabelPlugin],
    sourceMaps: true,
    configFile: false,
    filename: '/unknown',
    compact: false,
    comments: true,
    retainLines: false,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      projectRoot: '/foo/bar',
      platform: 'web',
    }),
  };

  // All of this code should remain intact.
  const sourceCode = `export default process.env.EXPO_ROUTER_IMPORT_MODE_WEB;`;

  expect(babel.transform(sourceCode, options)!.code).toEqual(`export default "lazy";`);
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
      hasUnusedStaticConfig: false,
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
