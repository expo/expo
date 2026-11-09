import { act, render } from '@testing-library/react-native';
import { Suspense, use } from 'react';

import type { ErrorBoundaryProps } from '../../views/Try';
import { Try } from '../../views/Try';
import { LoaderClient } from '../LoaderClient';
import { createLoaderContextValue, LoaderContext } from '../LoaderContext';
import { readLoaderData } from '../readLoaderData';
import { withLoaderErrorBoundary } from '../withLoaderErrorBoundary';

describe('loader error fallback commit', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('keeps the failed entry until the fallback commits, then allows one retry request', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');
    const error = await Promise.resolve(readLoaderData(ctx, '/fail', fetcher)).catch(
      (reason: unknown) => reason
    );
    let retry!: () => Promise<void>;

    function Reader(): null {
      const result = readLoaderData(ctx, '/fail', fetcher);
      if (result instanceof Promise) {
        use(result);
      }
      return null;
    }

    function ErrorFallback(props: ErrorBoundaryProps) {
      retry = props.retry;
      expect(props.error).toBe(error);
      expect(ctx.store.get('/fail')).toEqual({ error });
      return null;
    }

    await render(
      <LoaderContext value={ctx}>
        <Suspense fallback={null}>
          <Try catch={withLoaderErrorBoundary(ErrorFallback)}>
            <Reader />
          </Try>
        </Suspense>
      </LoaderContext>
    );

    expect(ctx.store.get('/fail')).toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(() => {
      retry();
    });

    expect(ctx.store.get('/fail')).toEqual({ data: 'recovered' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('retains the error while the error fallback is suspended', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const error = new Error('boom');
    ctx.store.set('/fail', { error });
    let resolveFallback!: () => void;
    const pendingFallback = new Promise<void>((resolve) => {
      resolveFallback = resolve;
    });

    function Reader(): never {
      throw error;
    }

    function ErrorFallback() {
      use(pendingFallback);
      return null;
    }

    await render(
      <LoaderContext value={ctx}>
        <Suspense fallback={null}>
          <Try catch={withLoaderErrorBoundary(ErrorFallback)}>
            <Reader />
          </Try>
        </Suspense>
      </LoaderContext>
    );

    expect(ctx.store.get('/fail')).toEqual({ error });

    await act(async () => {
      resolveFallback();
    });

    expect(ctx.store.get('/fail')).toBeUndefined();
  });
});
