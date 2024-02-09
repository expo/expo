import { Asset } from 'expo-asset';

import * as Font from '../Font';
import * as FontLoader from '../FontLoader';

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

describe('getNativeFontName', () => {
  // Sanity test platform resolution
  it(`never changes`, () => {
    for (const value of ['foo', false, null, undefined, true, {}, 'System']) {
      expect(FontLoader.getNativeFontName(value as any)).toBe(value);
    }
  });
});

describe('fontFamilyNeedsScoping', () => {
  // Sanity test platform resolution
  it(`never needs scoping in the browser`, () => {
    for (const value of ['foo', false, null, undefined, true, {}, 'System']) {
      expect(FontLoader.fontFamilyNeedsScoping(value as any)).toBe(false);
    }
  });
});

describe('getAssetForSource', () => {
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
