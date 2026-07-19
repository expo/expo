import type { ImageSourcePropType } from 'react-native';

import { convertOptionsIconToScreensPropsIcon } from '../optionsIconConverter';

describe(convertOptionsIconToScreensPropsIcon, () => {
  it('returns drawableResource when drawable is provided', () => {
    expect(convertOptionsIconToScreensPropsIcon({ drawable: 'ic_launcher' })).toEqual({
      type: 'drawableResource',
      name: 'ic_launcher',
    });
  });

  it('returns imageSource when src is provided as an object', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });

  it('returns imageSource when src is a numeric resource identifier', () => {
    const src = 123;
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });

  it('returns undefined when only sf is provided (iOS-only field)', () => {
    expect(convertOptionsIconToScreensPropsIcon({ sf: 'square.fill' })).toBeUndefined();
  });

  it('returns undefined when src is falsy (null)', () => {
    // Intentionally passing null to test falsy value handling
    expect(
      convertOptionsIconToScreensPropsIcon({ src: null as unknown as ImageSourcePropType })
    ).toBeUndefined();
  });

  it('returns imageSource regardless of renderingMode', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
    expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });
});
