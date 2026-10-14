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
      renderingMode: 'original',
    });
  });

  it('returns imageSource when src is a numeric resource identifier', () => {
    const src = 123;
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
      renderingMode: 'original',
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

  describe('xcasset', () => {
    it('returns xcasset icon when xcasset is provided', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: 'custom-icon' })).toEqual({
        type: 'xcasset',
        name: 'custom-icon',
      });
    });

    it('returns xcasset icon even when an icon color is passed, so symbol sets still resolve via imageNamed:', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: 'custom-icon' }, '#ff0000')).toEqual({
        type: 'xcasset',
        name: 'custom-icon',
      });
    });

    it('returns undefined when xcasset is falsy (empty string)', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: '' })).toBeUndefined();
    });

    it('prefers sf over xcasset when both are provided', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ sf: 'star.fill', xcasset: 'custom-icon' })
      ).toEqual({ type: 'sfSymbol', name: 'star.fill' });
    });

    // react-native-screens throws "icon and selectedIcon must be same type" when the two
    // differ. xcasset icons always resolve to the same type regardless of renderingMode,
    // since it has no effect on them.
    it('returns the same icon type for the normal and selected states regardless of renderingMode', () => {
      const icon = convertOptionsIconToScreensPropsIcon({ xcasset: 'home-outline' }, undefined);
      const selectedIcon = convertOptionsIconToScreensPropsIcon(
        { xcasset: 'home-filled' },
        '#ff0000'
      );
      expect(icon?.type).toBe(selectedIcon?.type);
    });
  });

  describe('renderingMode', () => {
    it('returns a template imageSource when renderingMode is "template"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' })).toEqual({
        type: 'imageSource',
        imageSource: src,
        renderingMode: 'template',
      });
    });

    it('returns an original imageSource when renderingMode is "original"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' })).toEqual({
        type: 'imageSource',
        imageSource: src,
        renderingMode: 'original',
      });
    });

    it('renders SF Symbols in monochrome when renderingMode is "template"', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ sf: 'star.fill', renderingMode: 'template' })
      ).toEqual({
        type: 'sfSymbol',
        name: 'star.fill',
        renderingMode: 'monochrome',
      });
    });

    it('keeps SF Symbol colors when renderingMode is "original"', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ sf: 'star.fill', renderingMode: 'original' })
      ).toEqual({
        type: 'sfSymbol',
        name: 'star.fill',
        renderingMode: 'original',
      });
    });

    it('leaves the SF Symbol rendering mode to the system when renderingMode is not set', () => {
      expect(convertOptionsIconToScreensPropsIcon({ sf: 'star.fill' })).not.toHaveProperty(
        'renderingMode'
      );
    });
  });

  describe('icon color', () => {
    it('renders an image as a template when an icon color is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToScreensPropsIcon({ src }, '#ff0000')).toEqual({
        type: 'imageSource',
        imageSource: src,
        renderingMode: 'template',
      });
    });

    it('keeps an explicit renderingMode when an icon color is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(
        convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' }, '#ff0000')
      ).toEqual({ type: 'imageSource', imageSource: src, renderingMode: 'original' });
    });

    it('is ignored for SF Symbols', () => {
      expect(convertOptionsIconToScreensPropsIcon({ sf: 'star.fill' }, '#ff0000')).toEqual({
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
