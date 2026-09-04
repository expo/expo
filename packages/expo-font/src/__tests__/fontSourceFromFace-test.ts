import { Asset } from 'expo-asset';

import { FontDisplay } from '../Font.types';
import { fontSourceFromFace } from '../fontSourceFromFace';

describe('fontSourceFromFace', () => {
  it('merges weight/style/display onto a string path', () => {
    expect(
      fontSourceFromFace({
        path: 'font.ttf',
        weight: 700,
        style: 'italic',
        display: FontDisplay.SWAP,
      })
    ).toEqual({
      uri: 'font.ttf',
      weight: 700,
      style: 'italic',
      display: FontDisplay.SWAP,
    });
  });

  it('carries weight/style/display onto an Asset path', () => {
    const asset = Asset.fromURI('http://localhost:8081/bold.ttf');

    const result = fontSourceFromFace({
      path: asset,
      weight: 700,
      style: 'italic',
      display: FontDisplay.SWAP,
    }) as any;

    expect(result.uri).toBe(asset.uri);
    expect(result.weight).toBe(700);
    expect(result.style).toBe('italic');
    expect(result.display).toBe(FontDisplay.SWAP);
  });

  it('does not set descriptor keys that were not specified for an Asset path', () => {
    const asset = Asset.fromURI('http://localhost:8081/regular.ttf');

    const result = fontSourceFromFace({ path: asset }) as any;

    expect(result.uri).toBe(asset.uri);
    expect('weight' in result).toBe(false);
    expect('style' in result).toBe(false);
    expect('display' in result).toBe(false);
  });

  it("falls back to the path FontResource's weight/style when the face leaves them unset", () => {
    expect(fontSourceFromFace({ path: { uri: 'a.ttf', weight: 300, style: 'italic' } })).toEqual({
      uri: 'a.ttf',
      weight: 300,
      style: 'italic',
      display: undefined,
    });
  });
});
