/** @jest-environment jsdom */

import { router } from '../exports';
import { useLoaderData } from '../hooks/useLoaderData';
import { defaultLoaderContextValue } from '../loaders/LoaderContext';
import { fetchLoader } from '../loaders/utils';
import { act, renderRouter } from '../testing-library';
import { Slot } from '../views/Navigator';
import type { ErrorBoundaryProps } from '../views/Try';

jest.mock('../loaders/utils', () => ({ fetchLoader: jest.fn() }));

afterEach(() => {
  jest.useRealTimers();
  defaultLoaderContextValue.client.clear();
  defaultLoaderContextValue.store.reset();
});

it('fetches once for a failed visit, retry, and revisit', async () => {
  jest.mocked(fetchLoader).mockRejectedValue(new Error('boom'));
  const ErrorBoundary = jest.fn((_props: ErrorBoundaryProps) => null);

  await renderRouter({
    _layout: { default: () => <Slot />, SuspenseFallback: () => null },
    index: () => null,
    fail: {
      default: function FailedScreen() {
        useLoaderData();
        return null;
      },
      ErrorBoundary,
    },
  });
  jest.useRealTimers();

  await act(async () => router.push('/fail'));

  expect(ErrorBoundary.mock.lastCall?.[0].error.message).toBe(
    'Failed to load loader data for route: /fail'
  );
  expect(defaultLoaderContextValue.store.get('/fail')).toBeUndefined();
  expect(fetchLoader).toHaveBeenCalledTimes(1);

  await act(() => {
    ErrorBoundary.mock.lastCall![0].retry();
  });

  expect(defaultLoaderContextValue.store.get('/fail')).toBeUndefined();
  expect(fetchLoader).toHaveBeenCalledTimes(2);

  await act(async () => router.back());
  await act(async () => router.push('/fail'));

  expect(defaultLoaderContextValue.store.get('/fail')).toBeUndefined();
  expect(fetchLoader).toHaveBeenCalledTimes(3);
  expect(ErrorBoundary.mock.lastCall?.[0].error.message).toBe(
    'Failed to load loader data for route: /fail'
  );
});

it('clears a loader error caught by a parent route fallback', async () => {
  jest.mocked(fetchLoader).mockRejectedValue(new Error('boom'));
  const ErrorBoundary = jest.fn((_props: ErrorBoundaryProps) => null);

  await renderRouter({
    _layout: { default: () => <Slot />, ErrorBoundary, SuspenseFallback: () => null },
    index: function FailedScreen() {
      useLoaderData();
      return null;
    },
  });
  jest.useRealTimers();

  expect(ErrorBoundary.mock.lastCall?.[0].error.message).toBe(
    'Failed to load loader data for route: /index'
  );
  expect(defaultLoaderContextValue.store.get('/index')).toBeUndefined();
  expect(fetchLoader).toHaveBeenCalledTimes(1);
});
