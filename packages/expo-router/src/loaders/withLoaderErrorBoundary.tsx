import { type ComponentType, use, useLayoutEffect } from 'react';

import type { ErrorBoundaryProps } from '../views/Try';
import { LoaderContext } from './LoaderContext';

const wrappedBoundaries = new WeakMap<
  ComponentType<ErrorBoundaryProps>,
  ComponentType<ErrorBoundaryProps>
>();

export function withLoaderErrorBoundary(ErrorBoundary: ComponentType<ErrorBoundaryProps>) {
  const cached = wrappedBoundaries.get(ErrorBoundary);
  if (cached) {
    return cached;
  }

  function LoaderErrorFallback(props: ErrorBoundaryProps) {
    const { store } = use(LoaderContext);
    useLayoutEffect(() => {
      // Recovery renders must keep the error until its fallback commits.
      store.clearError(props.error);
    }, [store, props.error]);
    return <ErrorBoundary {...props} />;
  }

  wrappedBoundaries.set(ErrorBoundary, LoaderErrorFallback);
  return LoaderErrorFallback;
}
