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

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

beforeEach(() => {
  jest.mocked(getConfig).mockClear();

  process.env._EXPO_INTERNAL_TESTING = '1';
});

const DEF_OPTIONS = {
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
it(`inlines static mode`, () => {
  process.env.NODE_ENV = 'development';
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      projectRoot: '/foo/bar',
      asyncRoutes: true,
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
"lazy";
export default "lazy";
const mode = "lazy";`);

  expect(getConfig).toHaveBeenCalledTimes(0);
});

it(`skips async routes setting in server environments`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      projectRoot: '/foo/bar',
      asyncRoutes: true,
      isServer: true,
      platform: 'web',
    }),
  };

  expect(babel.transform(`process.env.EXPO_ROUTER_IMPORT_MODE;`, options)!.code).toEqual(`"sync";`);
});

it(`skips async routes setting in native production`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      projectRoot: '/foo/bar',
      isDev: false,
      asyncRoutes: true,
      platform: 'ios',
    }),
  };

  expect(babel.transform(`process.env.EXPO_ROUTER_IMPORT_MODE;`, options)!.code).toEqual(`"sync";`);
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
// EXPO_ROUTER_ABS_APP_ROOT
process.env.EXPO_ROUTER_ABS_APP_ROOT;
// EXPO_ROUTER_APP_ROOT
process.env.EXPO_ROUTER_APP_ROOT;`;

  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_PROJECT_ROOT
"/foo/bar";
// EXPO_ROUTER_ABS_APP_ROOT
"/foo/bar/app";
// EXPO_ROUTER_APP_ROOT
"../app";`);
});

it(`uses custom app entry`, () => {
  process.env.NODE_ENV = 'development';

  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      projectRoot: '/foo/bar',
      platform: 'ios',
      routerRoot: '/random/value',
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

  expect(getConfig).toHaveBeenCalledTimes(0);
});

it(`uses custom relative app entry`, () => {
  process.env.NODE_ENV = 'development';

  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      projectRoot: '/foo/bar',
      platform: 'ios',
      routerRoot: './random/value',
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
"/foo/bar/random/value";
// EXPO_ROUTER_APP_ROOT
"../random/value";`);

  expect(getConfig).toHaveBeenCalledTimes(0);
});
