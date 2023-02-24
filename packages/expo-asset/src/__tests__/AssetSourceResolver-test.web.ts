import AssetSourceResolver from '../AssetSourceResolver';

const fontAsset = {
  __packager_asset: true,
  httpServerLocation: '/assets/assets/fonts',
  fileSystemLocation: '',
  width: undefined,
  height: undefined,
  scales: [1],
  hash: 'a3b8dba87c8a969c604cab9f4267e628',
  name: 'Spartan-Bold',
  type: 'ttf',
};
it(`resolves a font asset`, () => {
  expect(
    new AssetSourceResolver('http://localhost:8081/foo/bar', null, fontAsset).defaultAsset()
  ).toEqual({
    __packager_asset: true,
    height: undefined,
    width: undefined,
    scale: 1,
    // Important that the path relative to the origin is correct (`foo/bar` is removed).
    uri: 'http://localhost:8081/assets/assets/fonts/Spartan-Bold.ttf?platform=web&hash=a3b8dba87c8a969c604cab9f4267e628',
  });
});

it(`asserts the server url is required`, () => {
  expect(() => new AssetSourceResolver(null, null, fontAsset)).toThrowError(
    'Web assets require a server URL'
  );
});
