import { renderHook } from '@testing-library/react-native';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExpoKeepAwake from '../ExpoKeepAwake';
import { useKeepAwake } from '../index';

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
    const { unmount } = renderHook(useKeepAwake);
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
    renderHook(useKeepAwake);
    const firstComponentTag = mockActivate.mock.lastCall[0];
    renderHook(useKeepAwake);
    const secondComponentTag = mockActivate.mock.lastCall[0];
    expect(firstComponentTag).not.toEqual(secondComponentTag);
  });
});
