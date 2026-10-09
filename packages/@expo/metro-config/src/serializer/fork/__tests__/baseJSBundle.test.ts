import { runInNewContext } from 'vm';

import { baseJSBundle, getBaseUrlOption } from '../baseJSBundle';
import { microBundle } from './mini-metro';

it('records completion before append scripts without embedding a filename', async () => {
  const [entry, preModules, graph, options] = await microBundle({
    fs: { 'index.js': '' },
    options: { dev: false, platform: 'web' },
  });
  const result = baseJSBundle(entry, preModules, graph, {
    ...options,
    includeChunkCompletion: true,
    globalPrefix: 'test"prefix',
    runModule: false,
  });
  expect(result.post).toContain('__expo_chunk_completion__');
  expect(result.post).not.toContain('_expo/static');
  const context = {
    document: {
      currentScript: {
        tagName: 'SCRIPT',
        namespaceURI: 'http://www.w3.org/1999/xhtml',
        src: 'https://example.com/route.js',
      },
    },
  };
  runInNewContext(result.post, context);
  expect([...(context as any)['test"prefix__expo_chunk_completion__']]).toEqual([
    'https://example.com/route.js',
  ]);
  for (const document of [
    undefined,
    { currentScript: null },
    { currentScript: { tagName: 'script', src: {} } },
  ]) {
    const empty = { document };
    runInNewContext(result.post, empty);
    expect((empty as any)['test"prefix__expo_chunk_completion__']).toBeUndefined();
  }
});

it('propagates the selected callback through bundle and module processing', async () => {
  const [entry, preModules, graph, options] = await microBundle({
    fs: { 'index.js': `import('./route');`, 'route.js': '' },
    options: { dev: false, splitChunks: true },
  });
  const callback = jest.fn(() => ['/shared.js', '/route.js']);
  const result = baseJSBundle(entry, preModules, graph, {
    ...options,
    includeAsyncPaths: true,
    sourceUrl: 'http://localhost:8081/index.bundle?platform=web',
    unstable_getAsyncDependencyPath: callback,
  });
  expect(callback).toHaveBeenCalledTimes(1);
  expect(result.paths).toEqual({
    '/app/index.js': { '/app/route.js': ['/shared.js', '/route.js'] },
  });
  expect(result.modules.find(([id]) => String(id) === entry)![1]).toContain(
    '"paths":{"/app/route.js":["/shared.js","/route.js"]}'
  );
});

describe(getBaseUrlOption, () => {
  it(`returns the expected base url from dev server options`, () => {
    [
      ['https%3A%2F%2Fexpo.dev', 'https://expo.dev/'],
      ['https://expo.dev', 'https://expo.dev/'],
      ['/foo', '/foo/'],
      ['/', '/'],
    ].forEach(([input, expected]) => {
      expect(
        getBaseUrlOption(
          {
            // @ts-expect-error
            transformOptions: {
              customTransformOptions: {
                __proto__: null,
                baseUrl: input,
              },
            },
          },
          {}
        )
      ).toBe(expected);
    });
  });
  it(`returns the expected base url from direct API usage`, () => {
    [
      ['https%3A%2F%2Fexpo.dev', 'https%3A%2F%2Fexpo.dev/'],
      ['https://expo.dev', 'https://expo.dev/'],
      ['/foo', '/foo/'],
      ['/', '/'],
    ].forEach(([input, expected]) => {
      expect(
        getBaseUrlOption(
          {
            // @ts-expect-error
            transformOptions: {
              customTransformOptions: {
                __proto__: null,
                baseUrl: input,
              },
            },
          },
          {
            serializerOptions: {},
          }
        )
      ).toBe(expected);
    });
  });
});
