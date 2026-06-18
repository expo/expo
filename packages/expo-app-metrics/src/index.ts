import { installErrorHandler } from './installErrorHandler';

export { default } from './module';
export { AppMetricsRoot } from './AppMetricsRoot';
export type { Session } from './Session';
export * from './types';
export * from './useNetworkRequestObserver';

// Install the unhandled-JS-error handler as soon as `expo-app-metrics` is imported, so capture is
// live as early as the app pulls the module in. Idempotent.
installErrorHandler();
