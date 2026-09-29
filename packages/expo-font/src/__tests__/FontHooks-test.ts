import { renderHook, waitFor } from '@testing-library/react-native';

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

  const STUB_FONT_FAMILIES: Font.FontFamilyDefinition[] = [
    {
      fontFamily: 'OpenSans',
      fontDefinitions: [
        { path: 'path/to/font.ttf', weight: 400 },
        { path: 'path/to/font-bold.ttf', weight: 700 },
      ],
    },
  ];

  const loadAsyncSpy = jest.spyOn(Font, 'loadAsync').mockResolvedValue();

  describeStaticFonts('static fonts', () => {
    it('loads fonts when mounted', async () => {
      expect(useFonts(STUB_FONTS)).toEqual([true, null]);
      expect(loadAsyncSpy).toHaveBeenCalledWith(STUB_FONTS);
    });

    it('loads an array of font family definitions when mounted', async () => {
      expect(useFonts(STUB_FONT_FAMILIES)).toEqual([true, null]);
      expect(loadAsyncSpy).toHaveBeenCalledWith(STUB_FONT_FAMILIES);
    });
  });

  describeRuntimeFonts('runtime fonts', () => {
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

    it('does not crash when the array contains a malformed entry, and reports not loaded', async () => {
      const { result, unmount } = renderHook(useFonts, {
        initialProps: [null] as unknown as Font.FontFamilyDefinition[],
      });

      expect(result.current[RESULT_LOADED]).toBe(false);
      // Unmount before `loadAsync` resolves, so its `.then()` doesn't update state outside `act()`.
      unmount();
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
