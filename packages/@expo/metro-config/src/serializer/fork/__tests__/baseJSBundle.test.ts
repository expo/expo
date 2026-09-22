import { baseJSBundle, getBaseUrlOption } from '../baseJSBundle';
import { microBundle } from './mini-metro';

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
