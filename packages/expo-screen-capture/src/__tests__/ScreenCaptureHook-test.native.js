import { renderHook, cleanup } from '@testing-library/react-native';

import { allowScreenCapture, preventScreenCapture } from '../ExpoScreenCapture';
import * as ScreenCapture from '../ScreenCapture';

jest.mock('../ExpoScreenCapture', () => ({
  // Mock methods used in the hook
  preventScreenCapture: jest.fn().mockResolvedValue(),
  allowScreenCapture: jest.fn().mockResolvedValue(),
}));

describe('hooks', () => {
  afterEach(async () => {
    await cleanUpTags();
    await cleanup();
  });

  it('calls native methods once if mounted & unmounted', async () => {
    const hook = renderHook(ScreenCapture.usePreventScreenCapture);
    hook.rerender();
    expect(preventScreenCapture).toHaveBeenCalledTimes(1);

    hook.unmount();
    expect(allowScreenCapture).toHaveBeenCalledTimes(1);
  });

  it('calls native methods once if mounted & unmounted', async () => {
    const hook = renderHook(ScreenCapture.usePreventScreenCapture);
    hook.rerender();
    expect(preventScreenCapture).toHaveBeenCalledTimes(1);

    hook.unmount();
    expect(allowScreenCapture).toHaveBeenCalledTimes(1);
  });

  it('Re runs hook when tag changes', async () => {
    const hook = renderHook(ScreenCapture.usePreventScreenCapture, { initialProps: 'foo' });

    // Rerender first with the same key
    hook.rerender('foo');
    // Rerender secondly with a different key
    hook.rerender('bar');

    expect(preventScreenCapture).toHaveBeenCalledTimes(2);
    expect(allowScreenCapture).toHaveBeenCalledTimes(1);

    hook.unmount();
    // Unmounting results in final allowScreenCapture native method call
    expect(allowScreenCapture).toHaveBeenCalledTimes(2);
  });

  it('Unmounting one hook when two are active does not re-allow screen capturing', async () => {
    const hook1 = renderHook(ScreenCapture.usePreventScreenCapture, { initialProps: 'foo' });
    const hook2 = renderHook(ScreenCapture.usePreventScreenCapture, { initialProps: 'bar' });

    // Rerender hook1 with the same 'foo' key
    hook1.rerender('foo');
    hook2.unmount();

    expect(preventScreenCapture).toHaveBeenCalledTimes(2);
    expect(allowScreenCapture).toHaveBeenCalledTimes(0);
  });
});

async function cleanUpTags() {
  // Otherwise, these tags would persist between tests
  await ScreenCapture.allowScreenCaptureAsync();
  await ScreenCapture.allowScreenCaptureAsync('foo');
  await ScreenCapture.allowScreenCaptureAsync('bar');
}
