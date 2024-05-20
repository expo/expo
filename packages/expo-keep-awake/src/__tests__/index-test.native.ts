import { renderHook } from '@testing-library/react-hooks';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExpoKeepAwake from '../ExpoKeepAwake';
import { KeepAwakeOptions, useKeepAwake } from '../index';

describe(useKeepAwake, () => {
  const mockActivate = jest.fn();
  const mockDeactivate = jest.fn();

  beforeEach(() => {
    mockProperty(ExpoKeepAwake, 'activate', mockActivate);
    mockProperty(ExpoKeepAwake, 'deactivate', mockDeactivate);
  });

  afterEach(() => {
    jest.resetAllMocks();
    unmockAllProperties();
  });

  it('test default calls without any parameters', async () => {
    const { unmount } = renderHook(() => useKeepAwake());
    unmount();
    expect(mockActivate.mock.calls.length).toBe(1);
    expect(mockDeactivate.mock.calls.length).toBe(1);
  });

  it('test explicit calls with parameters', async () => {
    const { unmount } = renderHook(() => useKeepAwake('tag', { suppressDeactivateWarnings: true }));
    unmount();
    expect(mockActivate.mock.calls.length).toBe(1);
    expect(mockDeactivate.mock.calls.length).toBe(1);
    expect(mockDeactivate.mock.calls[0][0]).toEqual('tag');
  });

  it('test calls in different components default to using unique tags', async () => {
    renderHook(() => {
      useKeepAwake();
    });
    const firstComponentTag = mockActivate.mock.lastCall[0];
    renderHook(() => {
      useKeepAwake();
    });
    const secondComponentTag = mockActivate.mock.lastCall[0];
    expect(firstComponentTag).not.toEqual(secondComponentTag);
  });

  it("doesn't activate when enabled is false", async () => {
    renderHook(() => useKeepAwake('tag', { enabled: false }));
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('activates when enabled is true', async () => {
    renderHook(() => useKeepAwake('tag', { enabled: true }));
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it('activates when enabled is undefined', async () => {
    renderHook(() => useKeepAwake('tag', { enabled: undefined }));
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it('toggles when enabled is changed between renders', async () => {
    const hook = renderHook((options: KeepAwakeOptions) => useKeepAwake('tag', options), {
      initialProps: { enabled: false },
    });
    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockDeactivate).not.toHaveBeenCalled();

    hook.rerender({ enabled: true });
    expect(mockActivate).toHaveBeenCalledTimes(1);
    expect(mockDeactivate).not.toHaveBeenCalled();

    hook.rerender({ enabled: false });
    expect(mockActivate).toHaveBeenCalledTimes(1);
    expect(mockDeactivate).toHaveBeenCalledTimes(1);
  });
});
