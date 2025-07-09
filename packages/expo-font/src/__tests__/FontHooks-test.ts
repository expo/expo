import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'expo-modules-core';

import ExpoFontLoader from '../ExpoFontLoader';
import * as Font from '../Font';
import { useFonts } from '../FontHooks';

const describeRuntimeFonts: typeof describe =
  typeof window === 'undefined' ? describe.skip : describe;
const describeStaticFonts: typeof describe =
  typeof window === 'undefined' ? describe : describe.skip;

describe('useFonts', () => {
  const RESULT_LOADED = 0;
  const RESULT_ERROR = 1;

  const STUB_FONTS: Record<string, string> = {
    'OpenSans-Regular': 'path/to/font.ttf',
    'ComicSans-Regular': 'path/to/jailed/font.ttf',
  };

  beforeAll(() => {
    if (Platform.OS !== 'web') {
      ExpoFontLoader.getLoadedFonts.mockImplementation(() => []);
    }
  });

  const loadAsyncSpy = jest.spyOn(Font, 'loadAsync').mockResolvedValue();

  describeStaticFonts('static fonts', () => {
    it('loads fonts when mounted', async () => {
      expect(useFonts(STUB_FONTS)).toEqual([true, null]);
      expect(loadAsyncSpy).toHaveBeenCalledWith(STUB_FONTS);
    });
  });

  describeRuntimeFonts('runtime fonts', () => {
    it('loads fonts when mounted', async () => {
      const { result } = renderHook(useFonts, { initialProps: STUB_FONTS });

      // Ensure the hook returns false when fonts aren't loaded
      expect(result.current[RESULT_LOADED]).toBe(false);
      // Ensure the hook returns true when fonts are resolved
      await waitFor(() => {
        expect(result.current[RESULT_LOADED]).toBe(true);
      });
    });

    it('skips new font map when rerendered', async () => {
      const { result, rerender } = renderHook(useFonts, { initialProps: STUB_FONTS });

      // Wait for the assets to load
      await waitFor(() => {
        expect(result.current[RESULT_LOADED]).toBe(true);
      });

      // Rerender the hook with new modules
      rerender({ 'ComicSans-Bold': 'path/to/jailed/font-bold.ttf' });
      // Ensure the fonts are not reloaded
      expect(loadAsyncSpy).not.toHaveBeenCalledWith([9999]);
    });

    it('keeps assets loaded when unmounted', async () => {
      const { result, unmount } = renderHook(useFonts, { initialProps: STUB_FONTS });

      // Wait for the assets to load
      await waitFor(() => {
        expect(result.current[RESULT_LOADED]).toBe(true);
      });

      // Unmount the hook
      unmount();

      // Ensure the assets are still the same
      await waitFor(() => {
        expect(result.current[RESULT_LOADED]).toBe(true);
      });
    });

    it('returns error when encountered', async () => {
      // Mock a fake thrown error
      const error = new Error('test');
      loadAsyncSpy.mockRejectedValue(error);

      const { result } = renderHook(useFonts, { initialProps: STUB_FONTS });

      // Ensure the hook returns the error
      await waitFor(() => {
        expect(result.current[RESULT_ERROR]).toBe(error);
      });
    });
  });
});
