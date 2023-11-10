import { Asset } from 'expo-asset';

import * as Font from '../Font';
import * as FontLoader from '../FontLoader';

describe('loadSingleFontAsync', () => {
  it(`only accepts FontResource`, async () => {
    expect(() => FontLoader.loadSingleFontAsync('foo', 10 as any)).toThrow(
      'Expected font asset of type `string | FontResource | Asset` instead got: number'
    );
    expect(() => FontLoader.loadSingleFontAsync('foo', { uri: 10 as any })).toThrow(
      'Expected font asset of type `string | FontResource | Asset` instead got: {'
    );
    expect(() => FontLoader.loadSingleFontAsync('foo', Asset.fromURI('foo'))).toThrow(
      'Invalid URL'
    );
  });
  it(`rejects expo-asset`, async () => {
    expect(() => FontLoader.loadSingleFontAsync('foo', Asset.fromURI('foo'))).toThrow(
      'Invalid URL'
    );
    expect(() =>
      FontLoader.loadSingleFontAsync('foo', { uri: Asset.fromURI('foo') } as any)
    ).toThrow('Invalid URL');
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
