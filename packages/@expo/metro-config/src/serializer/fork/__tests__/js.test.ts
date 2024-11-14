import { parseModule, projectRoot } from './mini-metro';
import { wrapModule } from '../js';

jest.mock('fs');

async function helpWrap(src: string, options: Partial<Parameters<typeof wrapModule>[1]>) {
  return wrapModule(await parseModule('index.js', src, {}), {
    computedAsyncModulePaths: null,
    createModuleId: (m) => m,
    dev: true,
    includeAsyncPaths: false,
    projectRoot,
    serverRoot: projectRoot,
    skipWrapping: false,
    sourceUrl: 'http://localhost:8081/index.bundle?platform=web&dev=true&minify=false',
    splitChunks: false,
    ...options,
  });
}

describe(wrapModule, () => {
  describe('lazy disabled', () => {
    it(`wraps module with params in dev with lazy disabled`, async () => {
      const res = await helpWrap(
        `import { View } from 'react-native';
              console.log("Hello World")`,
        {
          dev: true,
          includeAsyncPaths: false,
        }
      );
      expect(res.paths).toEqual({});
      expect(res.src).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          var _reactNative = _$$_REQUIRE(_dependencyMap[0]);
          console.log("Hello World");
        },"/app/index.js",["/app/node_modules/react-native/index.js"],"index.js");"
      `);
    });
    it(`wraps module with params in dev with lazy loading disabled`, async () => {
      const res = await helpWrap(`const evan = import('bacon');`, {
        dev: true,
        includeAsyncPaths: false,
      });
      expect(res.paths).toEqual({});
      expect(res.src).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          var evan = _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
        },"/app/index.js",["/app/node_modules/bacon/index.js","/app/node_modules/expo-mock/async-require/index.js"],"index.js");"
      `);
    });
  });
  it(`wraps module with params in dev with lazy loading enabled`, async () => {
    const res = await helpWrap(`const evan = import('bacon');`, {
      dev: true,
      includeAsyncPaths: true,
    });
    expect(res.paths).toEqual({
      '/app/node_modules/bacon/index.js':
        '/node_modules/bacon/index.bundle?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false',
    });
    expect(res.src).toMatch(/expo-mock\/async-require/);
    expect(res.src).toMatch(/paths/);
    expect(res.src).toMatch(
      /node_modules\/bacon\/index\.bundle\?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false/
    );
    expect(res.src).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        var evan = _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/node_modules/bacon/index.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/node_modules/bacon/index.js":"/node_modules/bacon/index.bundle?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false"}},"index.js");"
    `);
  });

  it(`wraps module with params in prod with lazy loading enabled`, async () => {
    const res = await helpWrap(`const evan = import('bacon');`, {
      dev: false,
      includeAsyncPaths: false,
      splitChunks: true,
      computedAsyncModulePaths: {
        '/app/node_modules/bacon/index.js': '/_expo/static/js/web/0.chunk.js',
      },
    });
    expect(res.paths).toEqual({
      '/app/node_modules/bacon/index.js': '/_expo/static/js/web/0.chunk.js',
    });
    expect(res.src).toMatch(/expo-mock\/async-require/);
    expect(res.src).toMatch(/paths/);
    expect(res.src).not.toMatch(
      /\?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false/
    );
    expect(res.src).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        var evan = _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/node_modules/bacon/index.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/node_modules/bacon/index.js":"/_expo/static/js/web/0.chunk.js"}});"
    `);
  });

  // Disabled wrapping is used to calculate content hashes without knowing all the module paths ahead of time.
  it(`disables module wrapping in dev`, async () => {
    const res = await helpWrap(`const evan = import('bacon');`, {
      skipWrapping: true,
      dev: false,
      includeAsyncPaths: true,
    });
    expect(res.paths).toEqual({
      '/app/node_modules/bacon/index.js':
        '/node_modules/bacon/index.bundle?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false',
    });
    expect(res.src).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        var evan = _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/node_modules/bacon/index.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/node_modules/bacon/index.js":"/node_modules/bacon/index.bundle?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false"}});"
    `);
  });
  it(`disables module wrapping in prod`, async () => {
    const res = await helpWrap(`const evan = import('bacon');`, {
      dev: false,
      includeAsyncPaths: false,
      splitChunks: true,
      skipWrapping: true,
      computedAsyncModulePaths: {
        '/app/node_modules/bacon/index.js': '/_expo/static/js/web/0.chunk.js',
      },
    });
    expect(res.paths).toEqual({
      '/app/node_modules/bacon/index.js': '/_expo/static/js/web/0.chunk.js',
    });
    expect(res.src).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        var evan = _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/node_modules/bacon/index.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/node_modules/bacon/index.js":"/_expo/static/js/web/0.chunk.js"}});"
    `);
  });
});
