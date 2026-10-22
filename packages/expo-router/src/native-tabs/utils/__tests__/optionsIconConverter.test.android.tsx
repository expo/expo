import type { ImageSourcePropType } from 'react-native';

import { requireExpoSymbols } from '../../../optional-libraries/expo-symbols';
import { appendIconOptions, convertOptionsIconToScreensPropsIcon } from '../optionsIconConverter';

jest.mock('../../../optional-libraries/expo-symbols', () => ({
  requireExpoSymbols: jest.fn(() => jest.requireMock('expo-symbols')),
}));

jest.mock('expo-symbols', () => ({
  unstable_getMaterialSymbolSourceAsync: jest.fn(),
}));

const mockedRequireExpoSymbols = jest.mocked(requireExpoSymbols);

beforeEach(() => {
  mockedRequireExpoSymbols.mockImplementation(() => jest.requireMock('expo-symbols'));
});

describe(appendIconOptions, () => {
  it("throws for an md icon when expo-symbols isn't installed", () => {
    mockedRequireExpoSymbols.mockImplementation(() => {
      throw new Error(
        "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
      );
    });

    expect(() => appendIconOptions({}, { md: 'home' })).toThrow(
      "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
    );
    expect(mockedRequireExpoSymbols).toHaveBeenCalledWith(
      "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
    );
  });

  it("doesn't require expo-symbols for src or drawable icons", () => {
    const source = { uri: 'https://example.com/icon.png' };
    const srcOptions = {};
    const drawableOptions = {};

    appendIconOptions(srcOptions, { src: source });
    appendIconOptions(drawableOptions, { drawable: 'home' });

    expect(mockedRequireExpoSymbols).not.toHaveBeenCalled();
    expect(srcOptions).toEqual({ icon: { src: source } });
    expect(drawableOptions).toEqual({ icon: { drawable: 'home' } });
  });

  it('keeps an explicit renderingMode for an md icon', () => {
    const options = {};
    appendIconOptions(options, { md: 'home', renderingMode: { selected: 'original' } });
    expect(options).toEqual({
      icon: { src: undefined },
      selectedIcon: { src: undefined, renderingMode: 'original' },
    });
  });

  it('applies a renderingMode for each state', () => {
    const options = {};
    appendIconOptions(options, {
      drawable: { default: 'home', selected: 'home_filled' },
      renderingMode: { default: 'template', selected: 'original' },
    });
    expect(options).toEqual({
      icon: { drawable: 'home', renderingMode: 'template' },
      selectedIcon: { drawable: 'home_filled', renderingMode: 'original' },
    });
  });
});

describe(convertOptionsIconToScreensPropsIcon, () => {
  it('returns drawableResource when drawable is provided', () => {
    expect(convertOptionsIconToScreensPropsIcon({ drawable: 'ic_launcher' })).toEqual({
      platform: 'android',
      icon: {
        type: 'drawableResource',
        name: 'ic_launcher',
      },
    });
  });

  it('returns imageSource when src is provided as an object', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      platform: 'android',
      icon: {
        type: 'imageSource',
        imageSource: src,
      },
    });
  });

  it('returns imageSource when src is a numeric resource identifier', () => {
    const src = 123;
    expect(convertOptionsIconToScreensPropsIcon({ src })).toEqual({
      platform: 'android',
      icon: {
        type: 'imageSource',
        imageSource: src,
      },
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

  it('tints a drawable when renderingMode is "template"', () => {
    expect(
      convertOptionsIconToScreensPropsIcon({ drawable: 'ic_launcher', renderingMode: 'template' })
    ).toEqual({
      platform: 'android',
      icon: { type: 'drawableResource', name: 'ic_launcher', tinting: 'tinted' },
    });
  });

  it('keeps the drawable colors when renderingMode is "original"', () => {
    expect(
      convertOptionsIconToScreensPropsIcon({ drawable: 'ic_launcher', renderingMode: 'original' })
    ).toEqual({
      platform: 'android',
      icon: { type: 'drawableResource', name: 'ic_launcher', tinting: 'original' },
    });
  });

  describe('src', () => {
    const src = { uri: 'https://example.com/icon.png' };

    it('tints the image when renderingMode is "template"', () => {
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'template' })).toEqual({
        platform: 'android',
        icon: { type: 'imageSource', imageSource: src, tinting: 'tinted' },
      });
    });

    it('keeps the image colors when renderingMode is "original"', () => {
      expect(convertOptionsIconToScreensPropsIcon({ src, renderingMode: 'original' })).toEqual({
        platform: 'android',
        icon: { type: 'imageSource', imageSource: src, tinting: 'original' },
      });
    });
  });
});
