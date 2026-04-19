// Noop for iOS for now
// TODO: Remove once session handling is added for iOS
import { useMemo } from 'react';

export function startLoggingRouterMetrics() {}

export function useRouterMetricsHelpers() {
  return useMemo(() => ({ markPageInteractive: () => {} }), []);
}
