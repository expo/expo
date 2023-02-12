import { renderHook, cleanup } from '@testing-library/react-hooks';

import ExpoScreenCapture from '../ExpoScreenCapture';
import * as ScreenCapture from '../ScreenCapture';

describe('hooks', () => {
  afterEach(async () => {
    await cleanUpTags();
    await cleanup();
  });

  const preventScreenCaptureAsyncSpy = jest
    .spyOn(ExpoScreenCapture, 'preventScreenCapture')
    .mockResolvedValue();
  const allowScreenCaptureAsyncSpy = jest
    .spyOn(ExpoScreenCapture, 'allowScreenCapture')
    .mockResolvedValue();

  it('calls native methods once if mounted & unmounted', async () => {
    const hook = renderHook(() => ScreenCapture.usePreventScreenCapture());
    hook.rerender();
    expect(preventScreenCaptureAsyncSpy).toHaveBeenCalledTimes(1);

    hook.unmount();
    expect(allowScreenCaptureAsyncSpy).toHaveBeenCalledTimes(1);
  });

  it('calls native methods once if mounted & unmounted', async () => {
    const hook = renderHook(() => ScreenCapture.usePreventScreenCapture());
    hook.rerender();
    expect(preventScreenCaptureAsyncSpy).toHaveBeenCalledTimes(1);

    hook.unmount();
    expect(allowScreenCaptureAsyncSpy).toHaveBeenCalledTimes(1);
  });

  it('Re runs hook when tag changes', async () => {
    const hook = renderHook(({ key }) => ScreenCapture.usePreventScreenCapture(key));
    hook.rerender({ key: 'foo' });
    hook.rerender({ key: 'bar' });

    expect(preventScreenCaptureAsyncSpy).toHaveBeenCalledTimes(2);
    expect(allowScreenCaptureAsyncSpy).toHaveBeenCalledTimes(1);

    hook.unmount();
    // Unmounting results in final allowScreenCapture native method call
    expect(allowScreenCaptureAsyncSpy).toHaveBeenCalledTimes(2);
  });

  it('Unmounting one hook when two are active does not re-allow screen capturing', async () => {
    const hook1 = renderHook(() => ScreenCapture.usePreventScreenCapture());
    const hook2 = renderHook(({ key }) => ScreenCapture.usePreventScreenCapture(key));
    hook1.rerender();
    hook2.rerender({ key: 'foo' });
    hook2.unmount();

    expect(preventScreenCaptureAsyncSpy).toHaveBeenCalledTimes(2);
    expect(allowScreenCaptureAsyncSpy).toHaveBeenCalledTimes(0);
  });
});

async function cleanUpTags() {
  // Otherwise, these tags would persist between tests
  await ScreenCapture.allowScreenCaptureAsync();
  await ScreenCapture.allowScreenCaptureAsync('foo');
  await ScreenCapture.allowScreenCaptureAsync('bar');
}
