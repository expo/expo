import React, { useEffect } from 'react';

import { AppMetricsErrorBoundary } from './AppMetricsErrorBoundary';
import AppMetrics from './module';

/**
 * A root component that automatically marks the first render.
 * Wrap your app's root component with this to measure time to first render
 * without manually calling `AppMetrics.markFirstRender()`.
 *
 * Pass `errorBoundaryFallback` to also wrap the app in an `AppMetricsErrorBoundary` that records
 * React render-phase errors and renders the fallback in place of the crashed app. Without it no
 * boundary is mounted, so render errors keep React Native's default behavior unchanged (an existing
 * app that renders `AppMetricsRoot` with no props is unaffected). Those errors are still recorded by
 * the global `ErrorUtils` handler; only the boundary-only React component stack is unavailable.
 *
 * To render an error boundary deeper in the tree instead of at the root, use `AppMetricsErrorBoundary`
 * directly.
 */
export function AppMetricsRoot({
  children,
  errorBoundaryFallback,
}: {
  children: React.ReactNode;
  errorBoundaryFallback?: React.ReactElement | null;
}) {
  useEffect(() => {
    AppMetrics.markFirstRender();
  }, []);

  if (errorBoundaryFallback != null) {
    return (
      <AppMetricsErrorBoundary fallback={errorBoundaryFallback}>{children}</AppMetricsErrorBoundary>
    );
  }
  return <>{children}</>;
}

/**
 * Wraps a component with `AppMetricsRoot`.
 * Usage: `AppMetricsRoot.wrap(App);`
 */
AppMetricsRoot.wrap = function wrap<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <AppMetricsRoot>
      <Component {...props} />
    </AppMetricsRoot>
  );
  Wrapped.displayName = `AppMetricsRoot(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};
