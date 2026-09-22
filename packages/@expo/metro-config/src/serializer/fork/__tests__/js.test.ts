import { wrapModule } from '../js';
import { microBundle, parseModule, projectRoot } from './mini-metro';

jest.mock('fs');

async function helpWrap(src: string, options: Partial<Parameters<typeof wrapModule>[1]>) {
  return wrapModule(
    await parseModule('index.js', src, {
      dev: true,
      minify: false,
      type: 'module',
      platform: 'web',
      unstable_transformProfile: 'default',
    }),
    {
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
    }
  );
}

describe(wrapModule, () => {
  describe('BitSet callback emission', () => {
    it('does not invoke the callback for unresolved dependencies', async () => {
      const [entry, , graph, options] = await microBundle({
        fs: { 'index.js': `import('./missing');`, 'missing.js': '' },
      });
      const module = graph.dependencies.get(entry)!;
      for (const [key, dependency] of module.dependencies) {
        if (dependency.data.data.asyncType === 'async') {
          module.dependencies.set(key, { data: dependency.data });
        }
      }
      const callback = jest.fn(() => ['/missing.js']);
      const res = wrapModule(module, {
        ...options,
        includeAsyncPaths: true,
        unstable_getAsyncDependencyPath: callback,
        computedAsyncModulePaths: null,
        splitChunks: true,
        skipWrapping: false,
      });
      expect(callback).not.toHaveBeenCalled();
      expect(res.paths).toEqual({});
      expect(res.src).toContain(',[null,"/app/expo-mock/async-require"]');
    });

    it.each([`__prefetchImport('./route');`, `require.unstable_importMaybeSync('./route');`])(
      'emits a payload for %s',
      async (source) => {
        const callback = jest.fn(() => ['/route.js']);
        const res = await helpWrap(source, {
          includeAsyncPaths: true,
          unstable_getAsyncDependencyPath: callback,
        });
        expect(callback).toHaveBeenCalledTimes(1);
        expect(res.paths).toEqual({ '/app/route.js': ['/route.js'] });
      }
    );

    it('uses the callback before development URLs and forwards an array unchanged', async () => {
      const callback = jest.fn(() => ['/sub/shared.js', '/sub/route.js']);
      const res = await helpWrap(`import './sync'; import('./route');`, {
        dev: false,
        splitChunks: true,
        includeAsyncPaths: true,
        unstable_getAsyncDependencyPath: callback,
        computedAsyncModulePaths: { '/app/route.js': '/legacy.js' },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ absolutePath: '/app/route.js' }),
        expect.objectContaining({ includeAsyncPaths: true })
      );
      expect(res.paths).toEqual({ '/app/route.js': ['/sub/shared.js', '/sub/route.js'] });
      expect(res.src).toContain('"paths":{"/app/route.js":["/sub/shared.js","/sub/route.js"]}');
      expect(res.src).not.toContain('/legacy.js');
      expect(res.src).not.toContain('.bundle?');
    });

    it.each([null, undefined])(
      'omits nullish payloads (%s) without legacy fallback or an empty paths object',
      async (value) => {
        const callback = jest.fn(() => value);
        const res = await helpWrap(`import('./route');`, {
          dev: false,
          splitChunks: true,
          includeAsyncPaths: true,
          unstable_getAsyncDependencyPath: callback,
          computedAsyncModulePaths: { '/app/route.js': '/legacy.js' },
        });
        expect(callback).toHaveBeenCalledTimes(1);
        expect(res.paths).toEqual({});
        expect(res.src).toContain(',["/app/route.js",');
        expect(res.src).not.toContain('"paths":');
        expect(res.src).not.toContain('/legacy.js');
        expect(res.src).not.toContain('.bundle?');
      }
    );

    it('omits paths and does not call the callback during the stable-source pass', async () => {
      const callback = jest.fn(() => ['/route.js']);
      const res = await helpWrap(`import('./route');`, {
        includeAsyncPaths: false,
        splitChunks: true,
        unstable_getAsyncDependencyPath: callback,
        computedAsyncModulePaths: { '/app/route.js': '/legacy.js' },
      });
      expect(callback).not.toHaveBeenCalled();
      expect(res.paths).toEqual({});
      expect(res.src).not.toContain('"paths":');
      expect(res.src).not.toContain('/legacy.js');
    });

    it('keeps worker payloads scalar and ordinary singleton payloads as arrays', async () => {
      const res = await helpWrap(`require.unstable_resolveWorker('./worker'); import('./route');`, {
        includeAsyncPaths: true,
        unstable_getAsyncDependencyPath: (dependency) =>
          dependency.absolutePath === '/app/worker.js' ? '/worker.js' : ['/route.js'],
      });
      expect(res.paths).toEqual({
        '/app/worker.js': '/worker.js',
        '/app/route.js': ['/route.js'],
      });
      expect(res.src).toContain('"/app/worker.js":"/worker.js"');
      expect(res.src).toContain('"/app/route.js":["/route.js"]');
    });

    it('allows a weak edge to return null while retaining its module ID', async () => {
      const callback = jest.fn(() => null);
      const res = await helpWrap(`require.resolveWeak('./weak');`, {
        includeAsyncPaths: true,
        unstable_getAsyncDependencyPath: callback,
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(res.paths).toEqual({});
      expect(res.src).toContain('/app/weak.js');
      expect(res.src).not.toContain('"paths":');
    });

    it('keeps computed legacy paths when no callback is provided', async () => {
      const res = await helpWrap(`import('./route');`, {
        includeAsyncPaths: false,
        splitChunks: true,
        computedAsyncModulePaths: { '/app/route.js': '/legacy.js' },
      });
      expect(res.paths).toEqual({ '/app/route.js': '/legacy.js' });
    });

    it('rejects callback payloads outside Expo’s URL contract', async () => {
      await expect(
        helpWrap(`import('./route');`, {
          includeAsyncPaths: true,
          unstable_getAsyncDependencyPath: () => ({ files: ['/route.js'] }),
        })
      ).rejects.toThrow(/string.*array.*strings/);
    });
  });

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
        "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault").default;
          var _View = _interopRequireDefault(require(_dependencyMap[1], "react-native-web/dist/exports/View"));
          console.log("Hello World");
        },"/app/index.js",["/app/node_modules/@babel/runtime/helpers/interopRequireDefault/index.js","/app/node_modules/react-native-web/dist/exports/View/index.js"],"index.js");"
      `);
    });
    it(`wraps module with params in dev with lazy loading disabled`, async () => {
      const res = await helpWrap(`const evan = import('bacon');`, {
        dev: true,
        includeAsyncPaths: false,
      });
      expect(res.paths).toEqual({});
      expect(res.src).toMatchInlineSnapshot(`
        "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          const evan = require(_dependencyMap[1], "expo-mock/async-require")(_dependencyMap[0], _dependencyMap.paths, "bacon");
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
      "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        const evan = require(_dependencyMap[1], "expo-mock/async-require")(_dependencyMap[0], _dependencyMap.paths, "bacon");
      },"/app/index.js",{"0":"/app/node_modules/bacon/index.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/node_modules/bacon/index.js":"/node_modules/bacon/index.bundle?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false"}},"index.js");"
    `);
  });

  it('preserves the legacy development URL for a weak reference', async () => {
    const res = await helpWrap(`require.resolveWeak('./weak');`, {
      includeAsyncPaths: true,
    });
    expect(res.paths).toEqual({
      '/app/weak.js':
        '/weak.bundle?platform=web&dev=true&minify=false&modulesOnly=true&runModule=false',
    });
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
      "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        const evan = require(_dependencyMap[1], "expo-mock/async-require")(_dependencyMap[0], _dependencyMap.paths, "bacon");
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
      "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        const evan = require(_dependencyMap[1], "expo-mock/async-require")(_dependencyMap[0], _dependencyMap.paths, "bacon");
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
      "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        const evan = require(_dependencyMap[1], "expo-mock/async-require")(_dependencyMap[0], _dependencyMap.paths, "bacon");
      },"/app/index.js",{"0":"/app/node_modules/bacon/index.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/node_modules/bacon/index.js":"/_expo/static/js/web/0.chunk.js"}});"
    `);
  });
});
