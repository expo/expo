import { renderHook, waitFor } from '@testing-library/react-native';

import { Asset } from '../Asset';
import { useAssets } from '../AssetHooks';

describe('useAssets', () => {
  const RESULT_ASSETS = 0;
  const RESULT_ERRORS = 1;

  // note: these are fake module ids from `require()`
  const STUB_MODULES = [1337, 2337];
  const STUB_ASSETS = [
    new Asset({ name: 'test-first', type: 'jpg', uri: 'non/existing' }),
    new Asset({ name: 'test-second', type: 'png', uri: 'non/existing' }),
  ];

  const loadAsyncSpy = jest.spyOn(Asset, 'loadAsync').mockResolvedValue(STUB_ASSETS);

  it('loads assets when mounted', async () => {
    const { result } = renderHook(useAssets, { initialProps: STUB_MODULES });

    // Ensure the hook returns undefined when no assets are loaded
    expect(result.current[RESULT_ASSETS]).toBeUndefined();

    // Ensure the hook returns the loaded assets once resolved
    await waitFor(() => {
      expect(result.current[RESULT_ASSETS]).toBe(STUB_ASSETS);
    });
  });

  it('skips new asset list when rerendered', async () => {
    const { result, rerender } = renderHook(useAssets, { initialProps: STUB_MODULES });

    // Wait for the assets to load
    await waitFor(() => {
      expect(result.current[RESULT_ASSETS]).toBe(STUB_ASSETS);
    });

    // Rerender the hook with new modules
    rerender([9999]);

    // Ensure the assets are not reloaded
    expect(loadAsyncSpy).not.toHaveBeenCalledWith([9999]);
    // Ensure the assets are still the same
    await waitFor(() => {
      expect(result.current[RESULT_ASSETS]).toBe(STUB_ASSETS);
    });
  });

  it('keeps assets loaded when unmounted', async () => {
    const { result, unmount } = renderHook(useAssets, { initialProps: STUB_MODULES });

    // Wait for the assets to load
    await waitFor(() => {
      expect(result.current[RESULT_ASSETS]).toBe(STUB_ASSETS);
    });

    // Unmount the hook
    unmount();

    // Ensure the assets are still the same
    await waitFor(() => {
      expect(result.current[RESULT_ASSETS]).toBe(STUB_ASSETS);
    });
  });

  it('returns error when encountered', async () => {
    // Mock a fake thrown error
    const error = new Error('test');
    loadAsyncSpy.mockRejectedValue(error);

    const { result } = renderHook(useAssets, { initialProps: STUB_MODULES });

    // Ensure the hook returns the error
    await waitFor(() => {
      expect(result.current[RESULT_ERRORS]).toBe(error);
    });
  });
});
