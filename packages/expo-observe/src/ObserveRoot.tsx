import { AppMetricsRoot } from 'expo-app-metrics';
import type { ComponentProps, ReactNode } from 'react';

import { ObserveProvider } from './ObserveProvider';

type AppMetricsRootProps = ComponentProps<typeof AppMetricsRoot>;

export function ObserveRoot({ children, ...props }: AppMetricsRootProps & { children: ReactNode }) {
  return (
    <AppMetricsRoot {...props}>
      <ObserveProvider>{children}</ObserveProvider>
    </AppMetricsRoot>
  );
}

ObserveRoot.wrap = function wrap<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ObserveRoot>
      <Component {...props} />
    </ObserveRoot>
  );
  Wrapped.displayName = `ObserveRoot(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};
