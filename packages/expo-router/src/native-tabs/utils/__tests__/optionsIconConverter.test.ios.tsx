import type { ImageSourcePropType } from 'react-native';

import { convertOptionsIconToScreensPropsIcon } from '../optionsIconConverter';

describe(convertOptionsIconToScreensPropsIcon, () => {
  it('returns undefined when icon is undefined', () => {
    expect(convertOptionsIconToScreensPropsIcon(undefined)).toBeUndefined();
  });

  it('returns sfSymbol icon when sf is provided', () => {
    expect(convertOptionsIconToScreensPropsIcon({ sf: 'square.fill' })).toEqual({
      platform: 'ios',
      icon: {
        type: 'sfSymbol',
        name: 'square.fill',
      },
    });
  });

  it('returns imageSource when src is provided as an object', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      platform: 'ios',
      icon: {
        type: 'imageSource',
        imageSource: src,
        renderingMode: 'original',
      },
    });
  });

  it('returns imageSource when src is a numeric resource identifier', () => {
    const src = 123;
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      platform: 'ios',
      icon: {
        type: 'imageSource',
        imageSource: src,
        renderingMode: 'original',
      },
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
      platform: 'ios',
      icon: {
        type: 'sfSymbol',
        name: sf,
      },
    });
  });

  it('returns undefined when only drawable is provided (Android-only field)', () => {
    const drawableOnly = { drawable: 'ic_launcher' } as const;
    expect(convertOptionsIconToScreensPropsIcon(drawableOnly)).toBeUndefined();
  });

  describe('xcasset', () => {
    it('returns xcasset icon when xcasset is provided', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: 'custom-icon' })).toEqual({
        platform: 'ios',
        icon: {
          type: 'xcasset',
          name: 'custom-icon',
        },
      });
    });

    it('returns xcasset icon even when an icon color is passed, so symbol sets still resolve via imageNamed:', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: 'custom-icon' }, '#ff0000')).toEqual({
        platform: 'ios',
        icon: {
          type: 'xcasset',
          name: 'custom-icon',
        },
      });
    });

    it('returns undefined when xcasset is falsy (empty string)', () => {
      expect(convertOptionsIconToScreensPropsIcon({ xcasset: '' })).toBeUndefined();
    });

    it('prefers sf over xcasset when both are provided', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ sf: 'star.fill', xcasset: 'custom-icon' })
      ).toEqual({ platform: 'ios', icon: { type: 'sfSymbol', name: 'star.fill' } });
    });

    it('ignores renderingMode', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ xcasset: 'custom-icon', renderingMode: 'original' })
      ).toEqual({ platform: 'ios', icon: { type: 'xcasset', name: 'custom-icon' } });
    });
  });

  describe('renderingMode', () => {
    const src = { uri: 'https://example.com/icon.png' };

    it('renders an image as a template when renderingMode is "template"', () => {
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' })).toEqual({
        platform: 'ios',
        icon: { type: 'imageSource', imageSource: src, renderingMode: 'template' },
      });
    });

    it('keeps the image colors when renderingMode is "original"', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' }, '#ff0000')
      ).toEqual({
        platform: 'ios',
        icon: { type: 'imageSource', imageSource: src, renderingMode: 'original' },
      });
    });

    it('renders an image as a template when renderingMode is not set and an icon color is set', () => {
      expect(convertOptionsIconToScreensPropsIcon({ src }, '#ff0000')).toEqual({
        platform: 'ios',
        icon: { type: 'imageSource', imageSource: src, renderingMode: 'template' },
      });
    });

    it('keeps the image colors when renderingMode and icon color are not set', () => {
      expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
        platform: 'ios',
        icon: { type: 'imageSource', imageSource: src, renderingMode: 'original' },
      });
    });

    it('renders an SF Symbol in monochrome when renderingMode is "template"', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ sf: 'star.fill', renderingMode: 'template' })
      ).toEqual({
        platform: 'ios',
        icon: { type: 'sfSymbol', name: 'star.fill', renderingMode: 'monochrome' },
      });
    });

    it('keeps the SF Symbol colors when renderingMode is "original"', () => {
      expect(
        convertOptionsIconToScreensPropsIcon({ sf: 'star.fill', renderingMode: 'original' })
      ).toEqual({
        platform: 'ios',
        icon: { type: 'sfSymbol', name: 'star.fill', renderingMode: 'original' },
      });
    });
  });
});
