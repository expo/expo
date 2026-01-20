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
  // Simulate a file inside node_modules/expo-router where _ctx.ios.js would be
  filename: '/foo/bar/node_modules/expo-router/_ctx.ios.js',
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
    ...DEF_OPTIONS,
    // Simulate a file inside node_modules/expo-router
    filename: '/foo/bar/node_modules/expo-router/_ctx.ios.js',
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

  // EXPO_ROUTER_APP_ROOT is computed relative to the file being transformed
  // From /foo/bar/node_modules/expo-router/ to /foo/bar/app = ../../app
  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_PROJECT_ROOT
"/foo/bar";
// EXPO_ROUTER_ABS_APP_ROOT
"/foo/bar/app";
// EXPO_ROUTER_APP_ROOT
"../../app";`);
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

  // EXPO_ROUTER_APP_ROOT is computed relative to the file being transformed
  // From /foo/bar/node_modules/expo-router/ to /random/value = ../../../../random/value
  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_PROJECT_ROOT
"/foo/bar";
// EXPO_ROUTER_ABS_APP_ROOT
"/random/value";
// EXPO_ROUTER_APP_ROOT
"../../../../random/value";`);

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

  // EXPO_ROUTER_APP_ROOT is computed relative to the file being transformed
  // From /foo/bar/node_modules/expo-router/ to /foo/bar/random/value = ../../random/value
  expect(babel.transform(sourceCode, options)!.code).toEqual(`
// EXPO_PROJECT_ROOT
"/foo/bar";
// EXPO_ROUTER_ABS_APP_ROOT
"/foo/bar/random/value";
// EXPO_ROUTER_APP_ROOT
"../../random/value";`);

  expect(getConfig).toHaveBeenCalledTimes(0);
});

it(`handles hoisted packages in monorepos (e.g., with Bun)`, () => {
  process.env.NODE_ENV = 'development';

  // Simulate a monorepo where expo-router is hoisted to the root node_modules
  // but the app is in a nested workspace
  const options = {
    ...DEF_OPTIONS,
    // expo-router is hoisted to monorepo root
    filename: '/monorepo/node_modules/expo-router/_ctx.ios.js',
    caller: getCaller({
      name: 'metro',
      engine: 'hermes',
      // App is in a nested workspace
      projectRoot: '/monorepo/apps/my-app',
      platform: 'ios',
    }),
  };

  const sourceCode = `process.env.EXPO_ROUTER_APP_ROOT;`;

  // The relative path should be computed from the actual file location (hoisted)
  // to the app folder, not from where expo-router/entry might be expected to be
  // From /monorepo/node_modules/expo-router/ to /monorepo/apps/my-app/app = ../../apps/my-app/app
  expect(babel.transform(sourceCode, options)!.code).toEqual(`"../../apps/my-app/app";`);
});
