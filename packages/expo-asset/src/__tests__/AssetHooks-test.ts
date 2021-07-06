import { renderHook } from '@testing-library/react-hooks';

import { Asset } from '../Asset';
import { useAssets } from '../AssetHooks';

describe('useAssets', () => {
  const ASSETS = 0;
  const ERROR = 1;

  // note: these are fake module ids from `require()`
  const STUB_MODULES = [1337, 2337];
  const STUB_ASSETS = [
    new Asset({ name: 'test-first', type: 'jpg', uri: 'non/existing' }),
    new Asset({ name: 'test-second', type: 'png', uri: 'non/existing' }),
  ];

  const loadAsyncSpy = jest.spyOn(Asset, 'loadAsync').mockResolvedValue(STUB_ASSETS);

  it('loads assets when mounted', async () => {
    const hook = renderHook(useAssets, { initialProps: STUB_MODULES });

    expect(hook.result.current[ASSETS]).toBeUndefined();
    await hook.waitForNextUpdate();
    expect(hook.result.current[ASSETS]).toBe(STUB_ASSETS);
  });

  it('skips new asset list when rerendered', async () => {
    const hook = renderHook(useAssets, { initialProps: STUB_MODULES });
    await hook.waitForNextUpdate();
    expect(loadAsyncSpy).toBeCalledWith(STUB_MODULES);
    expect(hook.result.current[ASSETS]).toBe(STUB_ASSETS);

    const partialModules = STUB_MODULES.slice(1);
    hook.rerender(partialModules);
    expect(loadAsyncSpy).not.toBeCalledWith(partialModules);
    expect(hook.result.current[ASSETS]).toBe(STUB_ASSETS);
  });

  it('keeps assets loaded when unmounted', async () => {
    const hook = renderHook(useAssets, { initialProps: STUB_MODULES });
    await hook.waitForNextUpdate();
    expect(hook.result.current[ASSETS]).toBe(STUB_ASSETS);

    hook.unmount();
    expect(hook.result.current[ASSETS]).toBe(STUB_ASSETS);
  });

  it('returns error when encountered', async () => {
    const error = new Error('test');
    loadAsyncSpy.mockRejectedValue(error);

    const hook = renderHook(useAssets, { initialProps: STUB_MODULES });
    expect(hook.result.current[ERROR]).toBeUndefined();
    await hook.waitForNextUpdate();
    expect(hook.result.current[ERROR]).toBe(error);
  });
});
