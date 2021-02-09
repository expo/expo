import { Asset } from 'expo-asset';

import * as Font from '../Font';
import * as FontLoader from '../FontLoader';

describe('loadSingleFontAsync', () => {
  it(`only excepts FontResource`, async () => {
    await expect(FontLoader.loadSingleFontAsync('foo', 10 as any)).rejects.toThrow(
      'Expected font asset of type'
    );
    await expect(FontLoader.loadSingleFontAsync('foo', { uri: 10 as any })).rejects.toThrow(
      'Expected font asset of type'
    );
    await expect(FontLoader.loadSingleFontAsync('foo', Asset.fromURI('foo'))).rejects.toThrow(
      'Expected font asset of type'
    );
  });
  it(`rejects expo-asset`, async () => {
    await expect(FontLoader.loadSingleFontAsync('foo', Asset.fromURI('foo'))).rejects.toThrow(
      'Expected font asset of type'
    );
    await expect(
      FontLoader.loadSingleFontAsync('foo', { uri: Asset.fromURI('foo') } as any)
    ).rejects.toThrow('Expected font asset of type');
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
  });
  it(`doesn't support numeric assets on web`, () => {
    expect(() => FontLoader.getAssetForSource(10)).toThrow('number is not supported on web');
    expect(() =>
      FontLoader.getAssetForSource({ name: 'foo', display: Font.FontDisplay.FALLBACK, uri: 10 })
    ).toThrow('number is not supported on web');
    expect(() => FontLoader.getAssetForSource({ name: 'foo', localUri: 10 } as any)).toThrow(
      'number is not supported on web'
    );
  });
});
