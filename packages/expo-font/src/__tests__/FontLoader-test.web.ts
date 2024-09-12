import * as AssetRegistry from '@react-native/assets-registry/registry';
import { Asset } from 'expo-asset';

import * as Font from '../Font';
import * as FontLoader from '../FontLoader';
jest.mock('@react-native/assets-registry/registry');

describe('loadSingleFontAsync', () => {
  it(`only excepts FontResource`, async () => {
    expect(() =>
      FontLoader.loadSingleFontAsync('http://localhost:8081/font.ttf', 10 as any)
    ).toThrow('Expected font asset of type');
    expect(() =>
      FontLoader.loadSingleFontAsync('http://localhost:8081/font.ttf', { uri: 10 as any })
    ).toThrow('Expected font asset of type');
    expect(() =>
      FontLoader.loadSingleFontAsync(
        'http://localhost:8081/font.ttf',
        Asset.fromURI('http://localhost:8081/font.ttf')
      )
    ).toThrow('Expected font asset of type');
  });
  it(`rejects expo-asset`, async () => {
    expect(() =>
      FontLoader.loadSingleFontAsync(
        'http://localhost:8081/font.ttf',
        Asset.fromURI('http://localhost:8081/font.ttf')
      )
    ).toThrow('Expected font asset of type');
    expect(() =>
      FontLoader.loadSingleFontAsync('http://localhost:8081/font.ttf', {
        uri: Asset.fromURI('http://localhost:8081/font.ttf'),
      } as any)
    ).toThrow('Expected font asset of type');
  });
});

describe('getAssetForSource', () => {
  beforeAll(() => {
    type AssetRegistryEntry = {
      name: string;
      httpServerLocation: string;
      hash: string;
      type: string;
      scales: number[];
    };
    const entry: AssetRegistryEntry = {
      name: 'comic',
      httpServerLocation: '/assets/?unstable_path=.%2F..%2Ftest-suite%2Fassets',
      hash: '69d77ab',
      type: 'ttf',
      scales: [1],
    };
    jest.spyOn(AssetRegistry, 'getAssetByID').mockImplementation(() => entry);
  });

  it('works for FontSource object where uri is a module id', () => {
    expect(FontLoader.getAssetForSource({ uri: 40 })).toEqual({
      uri: '/assets/?unstable_path=.%2F..%2Ftest-suite%2Fassets%2Fcomic.ttf&platform=web&hash=69d77ab',
      display: 'auto',
    });
  });

  it(`parses font display`, () => {
    expect((FontLoader.getAssetForSource('foo') as any).display).toBe(Font.FontDisplay.AUTO);
    expect((FontLoader.getAssetForSource({ uri: 'foo' }) as any).display).toBe(
      Font.FontDisplay.AUTO
    );
    expect(
      (FontLoader.getAssetForSource({ uri: 'foo', display: Font.FontDisplay.SWAP }) as any).display
    ).toBe(Font.FontDisplay.SWAP);
    expect(
      (FontLoader.getAssetForSource({ default: 'foo', display: Font.FontDisplay.SWAP }) as any)
        .display
    ).toBe(Font.FontDisplay.SWAP);
  });
});
