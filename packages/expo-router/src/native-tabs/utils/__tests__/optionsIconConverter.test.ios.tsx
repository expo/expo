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

  describe('xcasset', () => {
    it('returns xcasset icon when xcasset is provided', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: 'custom-icon' })).toEqual({
        type: 'xcasset',
        name: 'custom-icon',
      });
    });

    it('returns xcasset icon when iconColor is set, so symbol sets still resolve via imageNamed:', () => {
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
    // differ, and NativeTabsView converts them with the normal/selected icon colors.
    it('returns the same icon type for the normal and selected states when only one is tinted', () => {
      const icon = convertOptionsIconToScreensPropsIcon({ xcasset: 'home-outline' }, undefined);
      const selectedIcon = convertOptionsIconToScreensPropsIcon(
        { xcasset: 'home-filled' },
        '#ff0000'
      );
      expect(icon?.type).toBe(selectedIcon?.type);
    });
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
