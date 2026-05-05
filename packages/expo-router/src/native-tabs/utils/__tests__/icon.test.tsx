import { renderHook, act } from '@testing-library/react-native';
import type { ImageSourcePropType } from 'react-native';

import { NativeTabsTriggerPromiseIcon, NativeTabsTriggerVectorIcon } from '../../common/elements';
import type { NativeTabsProps, SymbolOrImageSource } from '../../types';
import {
  convertComponentSrcToImageSource,
  convertIconColorPropToObject,
  convertOptionsIconToAndroidPropsIcon,
  convertOptionsIconToIOSPropsIcon,
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

describe(convertOptionsIconToIOSPropsIcon, () => {
  it('returns undefined when icon is undefined', () => {
    expect(convertOptionsIconToIOSPropsIcon(undefined)).toBeUndefined();
  });

  it('returns sfSymbol icon when sf is provided', () => {
    expect(convertOptionsIconToIOSPropsIcon({ sf: 'square.fill' })).toEqual({
      type: 'sfSymbol',
      name: 'square.fill',
    });
  });

  it('returns imageSource when src is provided as an object', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToIOSPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });

  it('returns imageSource when src is a numeric resource identifier', () => {
    const src = 123;
    expect(convertOptionsIconToIOSPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });

  it('returns undefined when sf is falsy (empty string)', () => {
    // @ts-expect-error testing falsy value
    expect(convertOptionsIconToIOSPropsIcon({ sf: '' })).toBeUndefined();
  });

  it('returns undefined when src is falsy (null)', () => {
    // Intentionally passing null to test falsy value handling
    expect(
      convertOptionsIconToIOSPropsIcon({ src: null as unknown as ImageSourcePropType })
    ).toBeUndefined();
  });

  it('prefers sf over src when both are provided', () => {
    const src = { uri: 'https://example.com/icon.png' };
    const sf = 'star.fill';
    expect(convertOptionsIconToIOSPropsIcon({ sf, src })).toEqual({
      type: 'sfSymbol',
      name: sf,
    });
  });

  it('returns undefined when only drawable is provided (Android-only field)', () => {
    const drawableOnly = { drawable: 'ic_launcher' } as const;
    expect(convertOptionsIconToIOSPropsIcon(drawableOnly)).toBeUndefined();
  });

  describe('renderingMode', () => {
    it('returns templateSource when renderingMode is "template"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToIOSPropsIcon({ src, renderingMode: 'template' })).toEqual({
        type: 'templateSource',
        templateSource: src,
      });
    });

    it('returns imageSource when renderingMode is "original"', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToIOSPropsIcon({ src, renderingMode: 'original' })).toEqual({
        type: 'imageSource',
        imageSource: src,
      });
    });
  });

  describe('smart default with iconColor', () => {
    it('defaults to imageSource (original) when iconColor is undefined', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToIOSPropsIcon({ src }, undefined)).toEqual({
        type: 'imageSource',
        imageSource: src,
      });
    });

    it('defaults to templateSource (template) when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(convertOptionsIconToIOSPropsIcon({ src }, '#ff0000')).toEqual({
        type: 'templateSource',
        templateSource: src,
      });
    });

    it('respects explicit renderingMode="original" even when iconColor is set', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(
        convertOptionsIconToIOSPropsIcon({ src, renderingMode: 'original' }, '#ff0000')
      ).toEqual({ type: 'imageSource', imageSource: src });
    });

    it('respects explicit renderingMode="template" even when iconColor is undefined', () => {
      const src = { uri: 'https://example.com/icon.png' };
      expect(
        convertOptionsIconToIOSPropsIcon({ src, renderingMode: 'template' }, undefined)
      ).toEqual({ type: 'templateSource', templateSource: src });
    });
  });
});

describe(convertOptionsIconToAndroidPropsIcon, () => {
  it('returns drawableResource when drawable is provided', () => {
    expect(convertOptionsIconToAndroidPropsIcon({ drawable: 'ic_launcher' })).toEqual({
      type: 'drawableResource',
      name: 'ic_launcher',
    });
  });

  it('returns imageSource when src is provided as an object', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToAndroidPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });

  it('returns imageSource when src is a numeric resource identifier', () => {
    const src = 123;
    expect(convertOptionsIconToAndroidPropsIcon({ src })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
  });

  it('returns undefined when only sf is provided (iOS-only field)', () => {
    expect(convertOptionsIconToAndroidPropsIcon({ sf: 'square.fill' })).toBeUndefined();
  });

  it('returns undefined when src is falsy (null)', () => {
    // Intentionally passing null to test falsy value handling
    expect(
      convertOptionsIconToAndroidPropsIcon({ src: null as unknown as ImageSourcePropType })
    ).toBeUndefined();
  });

  it('returns imageSource regardless of renderingMode', () => {
    const src = { uri: 'https://example.com/icon.png' };
    expect(convertOptionsIconToAndroidPropsIcon({ src, renderingMode: 'template' })).toEqual({
      type: 'imageSource',
      imageSource: src,
    });
    expect(convertOptionsIconToAndroidPropsIcon({ src, renderingMode: 'original' })).toEqual({
      type: 'imageSource',
      imageSource: src,
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

    it('returns src with renderingMode immediately when both are provided', () => {
      const src = { uri: 'https://example.com/icon.png' };
      const icon = { src, renderingMode: 'template' as const };
      const { result } = renderHook(() => useAwaitedScreensIcon(icon));
      expect(result.current).toEqual({ src, renderingMode: 'template' });
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

    it('preserves renderingMode when resolving a promise src', async () => {
      const asyncSrc = Promise.resolve({ uri: 'https://async.example/icon.png' });
      const { result } = renderHook(() =>
        useAwaitedScreensIcon({ src: asyncSrc, renderingMode: 'template' })
      );
      expect(result.current).toBeUndefined();
      await act(async () => {
        await asyncSrc;
      });
      expect(result.current).toEqual({
        src: { uri: 'https://async.example/icon.png' },
        renderingMode: 'template',
      });
    });

    it('preserves renderingMode "original" when resolving a promise src', async () => {
      const asyncSrc = Promise.resolve({ uri: 'https://async.example/icon.png' });
      const { result } = renderHook(() =>
        useAwaitedScreensIcon({ src: asyncSrc, renderingMode: 'original' })
      );
      await act(async () => {
        await asyncSrc;
      });
      expect(result.current).toEqual({
        src: { uri: 'https://async.example/icon.png' },
        renderingMode: 'original',
      });
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

describe(convertComponentSrcToImageSource, () => {
  const mockGetImageSource = jest.fn().mockReturnValue(Promise.resolve({ uri: 'resolved' }));
  const mockFamily = { getImageSource: mockGetImageSource };

  beforeEach(() => {
    mockGetImageSource.mockClear();
  });

  it('forwards renderingMode for VectorIcon elements', () => {
    const element = <NativeTabsTriggerVectorIcon family={mockFamily as any} name="home" />;
    const result = convertComponentSrcToImageSource(element, 'template');
    expect(result).toEqual({
      src: expect.any(Promise),
      renderingMode: 'template',
    });
  });

  it('forwards renderingMode "original" for VectorIcon elements', () => {
    const element = <NativeTabsTriggerVectorIcon family={mockFamily as any} name="home" />;
    const result = convertComponentSrcToImageSource(element, 'original');
    expect(result).toEqual({
      src: expect.any(Promise),
      renderingMode: 'original',
    });
  });

  it('omits renderingMode when undefined for VectorIcon elements', () => {
    const element = <NativeTabsTriggerVectorIcon family={mockFamily as any} name="home" />;
    const result = convertComponentSrcToImageSource(element);
    expect(result).toEqual({
      src: expect.any(Promise),
    });
    expect(result).not.toHaveProperty('renderingMode');
  });

  it('forwards renderingMode for PromiseIcon elements', () => {
    const loader = () => Promise.resolve({ uri: 'loaded' } as ImageSourcePropType);
    const element = <NativeTabsTriggerPromiseIcon loader={loader} />;
    const result = convertComponentSrcToImageSource(element, 'template');
    expect(result).toEqual({
      src: expect.any(Promise),
      renderingMode: 'template',
    });
  });
});
