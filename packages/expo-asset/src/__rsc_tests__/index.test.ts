import { Asset } from 'expo-asset';

it('creates an asset', () => {
  const asset = Asset.fromURI('https://github.com/expo.png');
  expect(asset).toEqual({
    downloaded: true,
    hash: null,
    height: null,
    localUri: null,
    name: '',
    type: 'png',
    uri: 'https://github.com/expo.png',
    width: null,
  });
});
