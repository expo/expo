import { installErrorHandler } from './installErrorHandler';
import { installLongTaskObserver } from './installLongTaskObserver';

export { default } from './module';
export { setErrorHandlerEnabled } from './installErrorHandler';
export { setLongTaskThreshold } from './installLongTaskObserver';
export { AppMetricsRoot } from './AppMetricsRoot';
export type { AppMetricsRootProps } from './AppMetricsRoot';
export { AppMetricsErrorBoundary } from './AppMetricsErrorBoundary';
export type {
  AppMetricsErrorBoundaryProps,
  AppMetricsErrorBoundaryFallbackProps,
} from './AppMetricsErrorBoundary';
export type { Session } from './Session';
export type { Span } from './Span';
export { startSpan, withSpan, recordSpan } from './spans';
export * from './types';
export * from './useNetworkRequestObserver';

// Install the unhandled-JS-error handler and the long task observer as soon as `expo-app-metrics` is
// imported, so capture is live as early as the app pulls the module in. Idempotent.
installErrorHandler();
installLongTaskObserver();
