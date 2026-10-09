import type { LoaderContextValue } from './LoaderContext';

/** Abandons an unobserved pending loader without disturbing settled or replacement state. */
export function abandonLoaderPath({ client, store }: LoaderContextValue, path: string): void {
  const entry = store.get(path);
  if (!(entry instanceof Promise)) {
    return;
  }

  if (!client.abort(path)) {
    return;
  }
  if (store.get(path) === entry) {
    store.clear(path);
  }
}

/** Defers abandonment so effect cleanup/setup handoffs can retain the loader in the same turn. */
export function scheduleAbandonLoaderPath(ctx: LoaderContextValue, path: string): () => void {
  let cancelled = false;
  queueMicrotask(() => {
    if (!cancelled) {
      abandonLoaderPath(ctx, path);
    }
  });
  return () => {
    cancelled = true;
  };
}
