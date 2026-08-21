import { Asset } from 'expo-asset';

import { FontDisplay } from '../Font.types';
import { fontSourceFromFace } from '../fontSourceFromFace';

describe('fontSourceFromFace', () => {
  it('merges weight/style/display/testString onto a string path', () => {
    expect(
      fontSourceFromFace({
        path: 'font.ttf',
        weight: 700,
        style: 'italic',
        display: FontDisplay.SWAP,
        testString: 'Ag',
      })
    ).toEqual({
      uri: 'font.ttf',
      weight: 700,
      style: 'italic',
      display: FontDisplay.SWAP,
      testString: 'Ag',
    });
  });

  it('carries weight/style/display/testString onto an Asset path', () => {
    const asset = Asset.fromURI('http://localhost:8081/bold.ttf');

    const result = fontSourceFromFace({
      path: asset,
      weight: 700,
      style: 'italic',
      display: FontDisplay.SWAP,
      testString: 'Ag',
    }) as any;

    expect(result.uri).toBe(asset.uri);
    expect(result.weight).toBe(700);
    expect(result.style).toBe('italic');
    expect(result.display).toBe(FontDisplay.SWAP);
    expect(result.testString).toBe('Ag');
  });

  it('does not set descriptor keys that were not specified for an Asset path', () => {
    const asset = Asset.fromURI('http://localhost:8081/regular.ttf');

    const result = fontSourceFromFace({ path: asset }) as any;

    expect(result.uri).toBe(asset.uri);
    expect('weight' in result).toBe(false);
    expect('style' in result).toBe(false);
    expect('display' in result).toBe(false);
    expect('testString' in result).toBe(false);
  });
});
