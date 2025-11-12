import { renderHook, act } from '@testing-library/react-native';

import type { SymbolOrImageSource } from '../../types';
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
    const weird = { foo: 'bar' } as any;
    expect(convertIconColorPropToObject(weird)).toEqual({ default: weird });
  });

  it('treats falsy non-object values as no color (empty string -> {})', () => {
    expect(convertIconColorPropToObject('')).toEqual({});
  });

  it('treats numeric 0 (falsy) as no color and returns empty object', () => {
    expect(convertIconColorPropToObject(0 as any)).toEqual({});
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
      ios: { type: 'templateSource', templateSource: src },
      android: { type: 'imageSource', imageSource: src },
    });
  });

  it('returns ios and android icon objects when src is a numeric resource identifier', () => {
    const src = 123 as any;
    const result = convertOptionsIconToRNScreensPropsIcon({ src });
    expect(result).toEqual({
      ios: { type: 'templateSource', templateSource: src },
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
    expect(convertOptionsIconToRNScreensPropsIcon({ src: null })).toEqual({
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
      const src = 123 as any;
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
      const asyncSrc = promise;
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
      const firstSrc = firstPromise;
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
