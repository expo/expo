import { renderHook, act } from '@testing-library/react-native';
import type { ImageSourcePropType } from 'react-native';

import type { NativeTabsProps, SymbolOrImageSource } from '../../types';
import {
  convertIconColorPropToObject,
  convertOptionsIconToRNScreensPropsIcon,
  useAwaitedScreensIcon,
} from '../icon';

describe(convertIconColorPropToObject, () => {
  it('returns an empty object when iconColor is undefined', () => {
    expect(convertIconColorPropToObject(undefined)).toEqual({});
  });

  it('returns an object with default when iconColor is a string', () => {
    expect(convertIconColorPropToObject('#ff0000')).toEqual({ default: '#ff0000' });
  });

  it('returns the same object when iconColor has default and selected properties', () => {
    const obj = { default: '#111111', selected: '#222222' };
    const result = convertIconColorPropToObject(obj);
    expect(result).toStrictEqual(obj);
  });

  it('returns the same object when iconColor has only selected property', () => {
    const obj = { selected: '#00ff00' };
    const result = convertIconColorPropToObject(obj);
    expect(result).toStrictEqual(obj);
  });

  it('treats an object without default/selected as a ColorValue and returns it under default', () => {
    // Intentionally passing wrong type to test edge case
    const weird = { foo: 'bar' } as unknown as NativeTabsProps['iconColor'];
    expect(convertIconColorPropToObject(weird)).toEqual({ default: weird });
  });

  it('treats falsy non-object values as no color (empty string -> {})', () => {
    expect(convertIconColorPropToObject('')).toEqual({});
  });

  it('treats numeric 0 (falsy) as no color and returns empty object', () => {
    // Intentionally passing wrong type to test edge case
    expect(convertIconColorPropToObject(0 as unknown as NativeTabsProps['iconColor'])).toEqual({});
  });
});

describe(convertOptionsIconToRNScreensPropsIcon, () => {
  it('returns undefined when icon is undefined', () => {
    expect(convertOptionsIconToRNScreensPropsIcon(undefined)).toBeUndefined();
  });

  it('returns ios and android icon objects when sf is provided', () => {
    const result = convertOptionsIconToRNScreensPropsIcon({ sf: 'square.fill' });
    expect(result).toEqual({
      ios: { type: 'sfSymbol', name: 'square.fill' },
      android: undefined,
    });
  });

  it('returns ios and android icon objects when src is provided as an object', () => {
    const src = { uri: 'https://example.com/icon.png' };
    const result = convertOptionsIconToRNScreensPropsIcon({ src });
    expect(result).toEqual({
      ios: { type: 'imageSource', imageSource: src },
      android: { type: 'imageSource', imageSource: src },
    });
  });

  it('returns ios and android icon objects when src is a numeric resource identifier', () => {
    const src = 123;
    const result = convertOptionsIconToRNScreensPropsIcon({ src });
    expect(result).toEqual({
      ios: { type: 'imageSource', imageSource: src },
      android: { type: 'imageSource', imageSource: src },
    });
  });

  it('returns undefined when sf is falsy (empty string)', () => {
    // @ts-expect-error testing falsy value
    expect(convertOptionsIconToRNScreensPropsIcon({ sf: '' })).toEqual({
      ios: undefined,
      android: undefined,
    });
  });

  it('returns undefined when src is falsy (null)', () => {
    // Intentionally passing null to test falsy value handling
    expect(
      convertOptionsIconToRNScreensPropsIcon({ src: null as unknown as ImageSourcePropType })
    ).toEqual({
      ios: undefined,
      android: undefined,
    });
  });

  it('prefers sf over src when both are provided', () => {
    const src = { uri: 'https://example.com/icon.png' };
    const sf = 'star.fill';
    const result = convertOptionsIconToRNScreensPropsIcon({ sf, src });
    expect(result).toEqual({
      ios: { type: 'sfSymbol', name: sf },
      android: expect.objectContaining({}),
    });
  });

  it('returns android drawableResource when drawable is provided', () => {
    const drawableOnly = { drawable: 'ic_launcher' } as const;
    expect(convertOptionsIconToRNScreensPropsIcon(drawableOnly)).toEqual({
      ios: undefined,
      android: { type: 'drawableResource', name: 'ic_launcher' },
    });
  });

  describe('renderingMode', () => {
    it('returns templateSource for iOS when renderingMode is "template"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon({ src, renderingMode: 'template' });
      expect(result?.ios).toEqual({ type: 'templateSource', templateSource: src });
    });

    it('returns imageSource for iOS when renderingMode is "original"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon({ src, renderingMode: 'original' });
      expect(result?.ios).toEqual({ type: 'imageSource', imageSource: src });
    });

    it('returns imageSource for Android regardless of renderingMode', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const resultTemplate = convertOptionsIconToRNScreensPropsIcon({
        src,
        renderingMode: 'template',
      });
      const resultOriginal = convertOptionsIconToRNScreensPropsIcon({
        src,
        renderingMode: 'original',
      });
      // Android always uses imageSource
      expect(resultTemplate?.android).toEqual({ type: 'imageSource', imageSource: src });
      expect(resultOriginal?.android).toEqual({ type: 'imageSource', imageSource: src });
    });
  });

  describe('smart default with iconColor', () => {
    it('defaults to imageSource (original) when iconColor is undefined', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon({ src }, undefined);
      expect(result?.ios).toEqual({ type: 'imageSource', imageSource: src });
    });

    it('defaults to templateSource (template) when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon({ src }, '#ff0000');
      expect(result?.ios).toEqual({ type: 'templateSource', templateSource: src });
    });

    it('respects explicit renderingMode="original" even when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon(
        { src, renderingMode: 'original' },
        '#ff0000'
      );
      expect(result?.ios).toEqual({ type: 'imageSource', imageSource: src });
    });

    it('respects explicit renderingMode="template" even when iconColor is undefined', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon(
        { src, renderingMode: 'template' },
        undefined
      );
      expect(result?.ios).toEqual({ type: 'templateSource', templateSource: src });
    });

    it('does not affect Android behavior when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const result = convertOptionsIconToRNScreensPropsIcon({ src }, '#ff0000');
      // Android always uses imageSource regardless of iconColor
      expect(result?.android).toEqual({ type: 'imageSource', imageSource: src });
    });
  });
});

describe('useAwaitedScreensIcon', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  it('returns undefined when icon is undefined', () => {
    const { result } = renderHook(() => useAwaitedScreensIcon(undefined));
    expect(result.current).toBeUndefined();
  });

  describe('non-promise source', () => {
    it('returns sf immediately when sf is provided', () => {
      const { result } = renderHook(() => useAwaitedScreensIcon({ sf: 'square.fill' }));
      expect(result.current).toEqual({ sf: 'square.fill' });
    });

    it('returns src immediately when src is an object', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const { result } = renderHook(() => useAwaitedScreensIcon({ src }));
      expect(result.current).toEqual({ src });
    });

    it('returns src immediately when src is a numeric resource identifier', () => {
      const src = 123;
      const { result } = renderHook(() => useAwaitedScreensIcon({ src }));
      expect(result.current).toEqual({ src });
    });

    it('returns drawable immediately when drawable is provided', () => {
      const drawableOnly = { drawable: 'ic_launcher' } as const;
      const { result } = renderHook(() => useAwaitedScreensIcon(drawableOnly));
      expect(result.current).toEqual(drawableOnly);
    });
  });

  describe('promise source', () => {
    it('returns undefined initially and resolves when src is an async function', async () => {
      const asyncSrc = Promise.resolve({ uri: 'https://async.example/icon.png' });
      const { result } = renderHook(() => useAwaitedScreensIcon({ src: asyncSrc }));
      expect(result.current).toBeUndefined();
      await act(async () => {
        await asyncSrc;
      });
      expect(result.current).toEqual({ src: { uri: 'https://async.example/icon.png' } });
    });

    it('does not update state after unmount when async src resolves late', async () => {
      let resolve: (value: any) => void;
      const promise = new Promise((res) => {
        resolve = res;
      });
      const asyncSrc = promise as unknown as ImageSourcePropType;
      const { result, unmount } = renderHook(() => useAwaitedScreensIcon({ src: asyncSrc }));
      expect(result.current).toBeUndefined();
      unmount();
      // Resolve after unmount; ensure no exception and no state update
      await act(async () => {
        resolve({ uri: 'https://late.example/icon.png' });
        await promise;
      });
      expect(result.current).toBeUndefined();
    });

    it('ignores late resolution of previous async src when icon prop changes', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise((res) => {
        resolveFirst = res;
      });
      const firstSrc = firstPromise as unknown as ImageSourcePropType;
      const { result, rerender } = renderHook(
        ({ icon }: { icon: SymbolOrImageSource }) => useAwaitedScreensIcon(icon),
        {
          initialProps: { icon: { src: firstSrc } },
        }
      );

      // initially undefined while first promise pending
      expect(result.current).toBeUndefined();

      // update to a synchronous source
      const nowSrc = { uri: 'https://now.example/icon.png' };
      rerender({ icon: { src: nowSrc } });
      expect(result.current).toEqual({ src: nowSrc });

      // resolve the first promise now; the hook should not overwrite the current value
      await act(async () => {
        resolveFirst({ uri: 'https://first-resolve.example/icon.png' });
        await firstPromise;
      });

      expect(result.current).toEqual({ src: nowSrc });
    });
  });
});
