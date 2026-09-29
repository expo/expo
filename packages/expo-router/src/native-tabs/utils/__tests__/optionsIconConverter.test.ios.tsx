import type { ImageSourcePropType } from 'react-native';

import {
  convertOptionsIconToScreensPropsIcon,
  resolveIconRenderingMode,
} from '../optionsIconConverter';

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

  describe('rendering mode override', () => {
    it('renders as a template when the override is "template"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src }, 'template')).toEqual({
        type: 'templateSource',
        templateSource: src,
      });
    });

    it('renders as an image when the override is "original"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(
        convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' }, 'original')
      ).toEqual({ type: 'imageSource', imageSource: src });
    });

    it('is ignored for SF Symbols', () => {
      expect(convertOptionsIconToScreensPropsIcon({ sf: 'star.fill' }, 'template')).toEqual({
        type: 'sfSymbol',
        name: 'star.fill',
      });
    });
  });
});

describe(resolveIconRenderingMode, () => {
  const src = { uri: 'https://example.com/icon.png' };

  it('returns undefined when icon is undefined', () => {
    expect(resolveIconRenderingMode(undefined)).toBeUndefined();
  });

  it('returns undefined for SF Symbols, which are always tinted by the system', () => {
    expect(resolveIconRenderingMode({ sf: 'star.fill' }, '#ff0000')).toBeUndefined();
  });

  it('returns undefined when sf takes precedence over src', () => {
    expect(resolveIconRenderingMode({ sf: 'star.fill', src })).toBeUndefined();
  });

  it('defaults to "original" when no icon color is set', () => {
    expect(resolveIconRenderingMode({ src })).toBe('original');
  });

  it('defaults to "template" when an icon color is set', () => {
    expect(resolveIconRenderingMode({ src }, '#ff0000')).toBe('template');
  });

  it('respects explicit renderingMode="original" even when an icon color is set', () => {
    expect(resolveIconRenderingMode({ src, renderingMode: 'original' }, '#ff0000')).toBe(
      'original'
    );
  });

  it('respects explicit renderingMode="template" even when no icon color is set', () => {
    expect(resolveIconRenderingMode({ src, renderingMode: 'template' })).toBe('template');
  });
});
