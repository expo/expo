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

  it('copies renderingMode to drawable icons', () => {
    const options = {};
    appendIconOptions(options, {
      drawable: { default: 'nano_home', selected: 'nano_home_filled' },
      renderingMode: 'original',
    });
    expect(options).toStrictEqual({
      icon: { drawable: 'nano_home', renderingMode: 'original' },
      selectedIcon: { drawable: 'nano_home_filled', renderingMode: 'original' },
    });
  });

  it('does not add renderingMode to drawable icons when unset', () => {
    const options = {};
    appendIconOptions(options, { drawable: 'nano_home' });
    expect(options).toStrictEqual({ icon: { drawable: 'nano_home' }, selectedIcon: undefined });
  });
});

describe(convertOptionsIconToScreensPropsIcon, () => {
  it('returns drawableResource when drawable is provided', () => {
    expect(convertOptionsIconToScreensPropsIcon({ drawable: 'ic_launcher' })).toEqual({
      type: 'drawableResource',
      name: 'ic_launcher',
    });
  });

  it('does not set tinting when drawable renderingMode is unset', () => {
    expect(convertOptionsIconToScreensPropsIcon({ drawable: 'nano_home' })).toStrictEqual({
      type: 'drawableResource',
      name: 'nano_home',
    });
  });

  it.each([
    ['template', 'tinted'],
    ['original', 'original'],
  ] as const)('maps drawable renderingMode "%s" to tinting "%s"', (renderingMode, tinting) => {
    expect(
      convertOptionsIconToScreensPropsIcon({ drawable: 'nano_home', renderingMode })
    ).toStrictEqual({ type: 'drawableResource', name: 'nano_home', tinting });
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
