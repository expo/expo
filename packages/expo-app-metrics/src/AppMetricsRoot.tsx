import React, { useEffect } from 'react';

import AppMetrics from './module';

/**
 * A root component that automatically marks the first render.
 * Wrap your app's root component with this to measure time to first render
 * without manually calling `AppMetrics.markFirstRender()`.
 */
export function AppMetricsRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AppMetrics.markFirstRender();
  }, []);

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
