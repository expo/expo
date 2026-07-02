import React, { useEffect } from 'react';

import {
  AppMetricsErrorBoundary,
  type AppMetricsErrorBoundaryProps,
} from './AppMetricsErrorBoundary';
import AppMetrics from './module';

export type AppMetricsRootProps = {
  children: React.ReactNode;
  /**
   * When set, the app is wrapped in an `AppMetricsErrorBoundary` with this `fallback`, capturing
   * React render-phase errors at the root. Omit it and no boundary is mounted, so render errors keep
   * React Native's default behavior (they're still recorded by the global `ErrorUtils` handler, just
   * without the component stack). Pass `null` to capture but render nothing.
   *
   * To place a boundary deeper in the tree, use `AppMetricsErrorBoundary` directly.
   */
  errorBoundaryFallback?: AppMetricsErrorBoundaryProps['fallback'];
};

/**
 * A root component that automatically marks the first render, so you can measure time to first
 * render without calling `AppMetrics.markFirstRender()` yourself.
 */
export function AppMetricsRoot({ children, errorBoundaryFallback }: AppMetricsRootProps) {
  useEffect(() => {
    AppMetrics.markFirstRender();
  }, []);

  // An explicit `errorBoundaryFallback` (including `null`) mounts the boundary; only omitting it
  // leaves the tree unwrapped so render errors keep React Native's default behavior.
  if (errorBoundaryFallback !== undefined) {
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
