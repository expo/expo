import { act, renderHook } from '@testing-library/react-native';

import { unstable_navigationEvents } from '../../../navigationEvents';
import type { NavigationState } from '../../../react-navigation/native';
import { usePreviewActivationPath } from '../usePreviewActivationPath';

const mockPrefetch = jest.fn();
jest.mock('../../../hooks', () => ({
  useRouter: () => ({ prefetch: mockPrefetch }),
}));

function report(previewId: string, key: string) {
  const state: NavigationState = {
    stale: false,
    key: 'stack',
    routeKeySeq: 0,
    type: 'stack',
    index: 0,
    routeNames: ['index', 'detail'],
    routes: [
      { key: 'index', name: 'index' },
      {
        key,
        name: 'detail',
        params: { __internal_expo_router_preview_id: previewId },
      },
    ],
  };
  unstable_navigationEvents.emit('routePreloaded', { state, routeKey: key });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockPrefetch.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

it('ignores delayed reports from an earlier opening of the same link', async () => {
  const { result } = await renderHook(usePreviewActivationPath);
  await act(() => result.current[1]('/detail'));
  const firstId = mockPrefetch.mock.calls[0][1].__internal__previewId;
  await act(() => result.current[1]('/detail'));
  // [1] is the second opening of this link.
  const secondId = mockPrefetch.mock.calls[1][1].__internal__previewId;
  await act(() => report(firstId, 'old'));
  expect(result.current[0]).toBeUndefined();
  expect(secondId).not.toBe(firstId);
  await act(() => report(secondId, 'new'));
  expect(result.current[0]).toBeUndefined();
  await act(() => jest.runOnlyPendingTimers());
  expect(result.current[0]).toEqual([{ key: 'new' }]);
});

it('isolates concurrent preview instances', async () => {
  const first = await renderHook(usePreviewActivationPath);
  const second = await renderHook(usePreviewActivationPath);
  await act(() => first.result.current[1]('/detail'));
  await act(() => second.result.current[1]('/detail'));
  await act(() => report(mockPrefetch.mock.calls[0][1].__internal__previewId, 'first'));
  await act(() => jest.runOnlyPendingTimers());
  expect(first.result.current[0]).toEqual([{ key: 'first' }]);
  expect(second.result.current[0]).toBeUndefined();
});

it('cancels a queued activation and ignores reports after dismissal', async () => {
  const { result } = await renderHook(usePreviewActivationPath);
  await act(() => result.current[1]('/detail'));
  const id = mockPrefetch.mock.calls[0][1].__internal__previewId;
  await act(() => report(id, 'queued'));
  await act(() => result.current[2]());
  await act(() => jest.runOnlyPendingTimers());
  expect(result.current[0]).toBeUndefined();
  await act(() => report(id, 'late'));
  expect(result.current[0]).toBeUndefined();
});
