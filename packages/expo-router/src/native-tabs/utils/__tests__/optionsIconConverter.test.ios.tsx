import type { ImageSourcePropType } from 'react-native';

import { convertOptionsIconToScreensPropsIcon } from '../optionsIconConverter';

describe(convertOptionsIconToScreensPropsIcon, () => {
  it('returns undefined when icon is undefined', () => {
    expect(convertOptionsIconToScreensPropsIcon(undefined)).toBeUndefined();
  });

  it('returns sfSymbol icon when sf is provided', () => {
    expect(convertOptionsIconToScreensPropsIcon({ sf: 'square.fill' })).toEqual({
      type: 'sfSymbol',
      name: 'square.fill',
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

  it('returns undefined when sf is falsy (empty string)', () => {
    // @ts-expect-error testing falsy value
    expect(convertOptionsIconToScreensPropsIcon({ sf: '' })).toBeUndefined();
  });

  it('returns undefined when src is falsy (null)', () => {
    // Intentionally passing null to test falsy value handling
    expect(
      convertOptionsIconToScreensPropsIcon({ src: null as unknown as ImageSourcePropType })
    ).toBeUndefined();
  });

  it('prefers sf over src when both are provided', () => {
    const src = { uri: 'https://example.com/icon.png' };
    const sf = 'star.fill';
    expect(convertOptionsIconToScreensPropsIcon({ sf, src })).toEqual({
      type: 'sfSymbol',
      name: sf,
    });
  });

  it('returns undefined when only drawable is provided (Android-only field)', () => {
    const drawableOnly = { drawable: 'ic_launcher' } as const;
    expect(convertOptionsIconToScreensPropsIcon(drawableOnly)).toBeUndefined();
  });

  describe('renderingMode', () => {
    it('returns templateSource when renderingMode is "template"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' })).toEqual({
        type: 'templateSource',
        templateSource: src,
      });
    });

    it('returns imageSource when renderingMode is "original"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' })).toEqual({
        type: 'imageSource',
        imageSource: src,
      });
    });
  });

  describe('smart default with iconColor', () => {
    it('defaults to imageSource (original) when iconColor is undefined', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src }, undefined)).toEqual({
        type: 'imageSource',
        imageSource: src,
      });
    });

    it('defaults to templateSource (template) when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src }, '#ff0000')).toEqual({
        type: 'templateSource',
        templateSource: src,
      });
    });

    it('respects explicit renderingMode="original" even when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(
        convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' }, '#ff0000')
      ).toEqual({ type: 'imageSource', imageSource: src });
    });

    it('respects explicit renderingMode="template" even when iconColor is undefined', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(
        convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' }, undefined)
      ).toEqual({ type: 'templateSource', templateSource: src });
    });
  });
});
