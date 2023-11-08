import { getMetroDirectBundleOptions, createBundleUrlPath } from '../metroOptions';

describe(getMetroDirectBundleOptions, () => {
  it(`returns basic options`, () => {
    expect(
      getMetroDirectBundleOptions({
        mainModuleName: '/index.js',
        mode: 'development',
        platform: 'ios',
      })
    ).toEqual({
      customResolverOptions: {},
      customTransformOptions: { preserveEnvVars: false },
      dev: true,
      entryFile: '/index.js',
      inlineSourceMap: false,
      minify: false,
      platform: 'ios',
      unstable_transformProfile: 'default',
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
});
