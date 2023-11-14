import { getMetroDirectBundleOptions, createBundleUrlPath } from '../metroOptions';

describe(getMetroDirectBundleOptions, () => {
  it(`returns basic options`, () => {
    expect(
      getMetroDirectBundleOptions({
        mainModuleName: '/index.js',
        mode: 'development',
        platform: 'ios',
        baseUrl: '/foo/',
      })
    ).toEqual({
      customResolverOptions: {},
      customTransformOptions: { preserveEnvVars: false, baseUrl: '/foo/' },
      dev: true,
      entryFile: '/index.js',
      inlineSourceMap: false,
      minify: false,
      platform: 'ios',
      unstable_transformProfile: 'default',
      serializerOptions: {},
    });
  });
  it(`injects source url if serializer options are provided`, () => {
    expect(
      getMetroDirectBundleOptions({
        mainModuleName: '/index.js',
        mode: 'development',
        platform: 'ios',
        serializerIncludeMaps: true,
      })
    ).toEqual({
      sourceUrl:
        'http://localhost:8081/index.js.bundle?platform=ios&dev=true&hot=false&serializer.map=true',
      customResolverOptions: {},
      customTransformOptions: { preserveEnvVars: false },
      dev: true,
      entryFile: '/index.js',
      inlineSourceMap: false,
      minify: false,
      platform: 'ios',
      unstable_transformProfile: 'default',
      serializerOptions: {
        includeMaps: true,
      },
      sourceMapUrl:
        'http://localhost:8081/index.js.map?platform=ios&dev=true&hot=false&serializer.map=true',
    });
  });
});
describe(createBundleUrlPath, () => {
  it(`returns basic options`, () => {
    expect(
      createBundleUrlPath({
        mainModuleName: 'index',
        mode: 'development',
        platform: 'ios',
      })
    ).toEqual('/index.bundle?platform=ios&dev=true&hot=false');
  });
  it(`returns basic options with baseUrl as a fully qualified URL`, () => {
    expect(
      createBundleUrlPath({
        mainModuleName: 'index',
        mode: 'development',
        platform: 'ios',
        baseUrl: 'https://localhost:8081/dist/',
      })
    ).toEqual(
      '/index.bundle?platform=ios&dev=true&hot=false&transform.baseUrl=https%3A%2F%2Flocalhost%3A8081%2Fdist%2F'
    );
  });
});
