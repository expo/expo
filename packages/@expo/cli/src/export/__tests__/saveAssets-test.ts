import { modifyBundlesWithSourceMaps } from '../saveAssets';

jest.mock('../../log');

jest.mock('../persistMetroAssets', () => ({
  copyInBatchesAsync: jest.fn(),
}));

describe(modifyBundlesWithSourceMaps, () => {
  it(`should modify bundles with source maps`, () => {
    const res = modifyBundlesWithSourceMaps(
      `_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js`,
      `
//# sourceMappingURL=//localhost:8082/packages/expo-router/entry.map?platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static
//# sourceURL=http://localhost:8082/packages/expo-router/entry.bundle//&platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static`,
      true
    );
    expect(res.split('\n')[1]).toBe(
      '//# sourceMappingURL=/_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js.map'
    );
    expect(res.split('\n')[2]).toBe(
      '//# sourceURL=/_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js'
    );
  });
  it(`should strip source source maps`, () => {
    const res = modifyBundlesWithSourceMaps(
      `_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js`,
      `
//# sourceMappingURL=//localhost:8082/packages/expo-router/entry.map?platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static
//# sourceURL=http://localhost:8082/packages/expo-router/entry.bundle//&platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static`,
      false
    );
    expect(res.trim()).toEqual('');
  });
  it(`should partially modify bundles with source maps`, () => {
    const res = modifyBundlesWithSourceMaps(
      `_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js`,
      `
//# sourceURL=http://localhost:8082/packages/expo-router/entry.bundle//&platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static`,
      true
    );

    expect(res.split('\n')[1]).toBe(
      '//# sourceURL=/_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js'
    );
  });
  it(`should skip modifying bundles without source maps`, () => {
    const res = modifyBundlesWithSourceMaps(
      `_expo/static/js/web/entry-3174c2a5c9b63f8dcf27c09b187bdc3c.js`,
      `__r(1)`,
      true
    );
    expect(res).toBe(`__r(1)`);
  });
});
