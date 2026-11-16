/** @jest-environment jsdom */

import type { LoadedRoute, RouteNode } from '../Route';
import { act, renderRouter } from '../testing-library';
import { createAsyncScreenComponent } from '../useScreens';
import { Slot } from '../views/Navigator';
import type { ErrorBoundaryProps } from '../views/Try';

function createRoute(loadRoute: () => LoadedRoute | PromiseLike<LoadedRoute>) {
  const route: RouteNode = {
    type: 'route',
    route: 'index',
    contextKey: './index.tsx',
    children: [],
    dynamic: null,
    // @ts-expect-error RouteNode declares loadRoute as synchronous, but lazy routes return promises.
    loadRoute,
  };
  return route;
}

async function retry(boundary: jest.Mock<null, [ErrorBoundaryProps]>) {
  await act(() => {
    // A failed retry can leave this promise pending; let act flush the boundary update instead.
    void boundary.mock.lastCall![0].retry();
  });
}

describe(createAsyncScreenComponent, () => {
  afterEach(() => {
    // Restore timers before Testing Library's outer cleanup hook flushes microtasks.
    jest.useRealTimers();
  });

  it('retries failed route loads and reuses the loaded screen on remount', async () => {
    const firstError = new Error('First download failed');
    const secondError = new Error('Second download failed');
    const LoadedScreen = jest.fn(() => null);
    const ErrorBoundary = jest.fn((_props: ErrorBoundaryProps) => null);
    const SuspenseFallback = jest.fn(() => null);
    const loadRoute = jest
      .fn<Promise<LoadedRoute>, []>()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError)
      .mockResolvedValue({ default: LoadedScreen });
    const Screen = createAsyncScreenComponent(createRoute(loadRoute));
    const routes = {
      _layout: { default: () => <Slot />, ErrorBoundary, SuspenseFallback },
      index: () => <Screen />,
    };
    const view = await renderRouter(routes);

    expect(ErrorBoundary.mock.lastCall?.[0].error).toBe(firstError);
    expect(loadRoute).toHaveBeenCalledTimes(1);
    expect(LoadedScreen).not.toHaveBeenCalled();

    await retry(ErrorBoundary);

    expect(ErrorBoundary.mock.lastCall?.[0].error).toBe(secondError);
    expect(loadRoute).toHaveBeenCalledTimes(2);
    expect(LoadedScreen).not.toHaveBeenCalled();

    await retry(ErrorBoundary);

    expect(loadRoute).toHaveBeenCalledTimes(3);
    expect(LoadedScreen).toHaveBeenCalled();

    await view.unmount();
    LoadedScreen.mockClear();
    ErrorBoundary.mockClear();
    SuspenseFallback.mockClear();
    await renderRouter(routes);

    expect(LoadedScreen).toHaveBeenCalled();
    expect(ErrorBoundary).not.toHaveBeenCalled();
    expect(SuspenseFallback).not.toHaveBeenCalled();
    expect(loadRoute).toHaveBeenCalledTimes(3);
  });

  it('resolves an already-loaded module without rendering the loading fallback on retry', async () => {
    const loadError = new Error('Loading route chunk failed');
    const LoadedScreen = jest.fn(() => null);
    const ErrorBoundary = jest.fn((_props: ErrorBoundaryProps) => null);
    const SuspenseFallback = jest.fn(() => null);
    const loadRoute = jest
      .fn<LoadedRoute | Promise<LoadedRoute>, []>()
      .mockRejectedValueOnce(loadError)
      .mockReturnValue({ default: LoadedScreen });
    const Screen = createAsyncScreenComponent(createRoute(loadRoute));

    await renderRouter({
      _layout: { default: () => <Slot />, ErrorBoundary, SuspenseFallback },
      index: () => <Screen />,
    });

    expect(ErrorBoundary.mock.lastCall?.[0].error).toBe(loadError);
    expect(loadRoute).toHaveBeenCalledTimes(1);
    expect(LoadedScreen).not.toHaveBeenCalled();
    SuspenseFallback.mockClear();

    await retry(ErrorBoundary);

    expect(LoadedScreen).toHaveBeenCalled();
    expect(SuspenseFallback).not.toHaveBeenCalled();
    expect(loadRoute).toHaveBeenCalledTimes(2);
  });
});
