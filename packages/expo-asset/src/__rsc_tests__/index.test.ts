import { Asset } from 'expo-asset';

it('creates an asset', () => {
  const asset = Asset.fromURI('https://github.com/expo.png');
  expect(asset).toEqual({
    downloaded: true,
    hash: null,
    height: 0,
    localUri: 'https://github.com/expo.png',
    name: 'expo.png',
    type: 'png',
    uri: 'https://github.com/expo.png',
    width: 0,
  });
});
