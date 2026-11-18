/** @jest-environment jsdom */

import { Slot } from '../../exports';
import { router } from '../../imperative-api';
import { fetchLoader } from '../../loaders/utils';
import { act, renderRouter } from '../../testing-library';
import { useLoaderData } from '../useLoaderData';

jest.mock('../../loaders/utils', () => ({ fetchLoader: jest.fn() }));

afterEach(() => {
  jest.useRealTimers();
  jest.mocked(fetchLoader).mockReset();
});

it('requests the grouped index loader after navigating to its public URL', async () => {
  jest.mocked(fetchLoader).mockResolvedValue({ data: 'grouped-index' });
  let data: unknown;
  await renderRouter({
    _layout: { default: () => <Slot />, SuspenseFallback: () => null },
    index: () => null,
    '(group)/index': function GroupedIndex() {
      data = useLoaderData();
      return null;
    },
  });
  jest.useRealTimers();

  await act(() => router.push('/(group)'));

  expect(fetchLoader).toHaveBeenCalledTimes(1);
  expect(fetchLoader).toHaveBeenCalledWith(
    '/(group)/index',
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
  expect(data).toEqual({ data: 'grouped-index' });
});

it('requests a platform-specific catch-all loader without its source extension', async () => {
  jest.mocked(fetchLoader).mockResolvedValue({ data: 'platform-catch-all' });
  let data: unknown;
  let selectedPlatform: string | undefined;
  await renderRouter({
    _layout: { default: () => <Slot />, SuspenseFallback: () => null },
    index: () => null,
    '(group)/platform/[...slug].web': function PlatformRoute() {
      selectedPlatform = 'web';
      data = useLoaderData();
      return null;
    },
    '(group)/platform/[...slug]': function NativeRoute() {
      selectedPlatform = 'native';
      return null;
    },
  });
  jest.useRealTimers();

  await act(() => router.push('/platform/alpha/beta'));

  expect(fetchLoader).toHaveBeenCalledTimes(1);
  expect(fetchLoader).toHaveBeenCalledWith(
    '/(group)/platform/alpha/beta',
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
  expect(data).toEqual({ data: 'platform-catch-all' });
  expect(selectedPlatform).toBe('web');
});
