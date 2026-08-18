import Observe from './module';

/**
 * @deprecated Use `Observe` instead. `AppMetrics` is the legacy name of this API from SDK 55.
 */
export { default as AppMetrics } from 'expo-app-metrics';
export type {
  AppMetricsErrorBoundaryFallbackProps,
  AppMetricsErrorBoundaryProps,
  AppMetricsRootProps,
  ExpoAppMetricsModuleType,
  LogAttributeValue,
  LogEventOptions,
  LogSeverity,
  MetricAttributes,
} from 'expo-app-metrics';
export { ObserveErrorBoundary } from './ObserveErrorBoundary';
export type {
  ObserveErrorBoundaryProps,
  ObserveErrorBoundaryFallbackProps,
} from './ObserveErrorBoundary';
export { ObserveInteractiveMarker } from './ObserveInteractiveMarker';
export type { ObserveInteractiveMarkerProps } from './ObserveInteractiveMarker';
export { ObserveRoot } from './ObserveRoot';

Observe.setBundleDefaults({
  environment: process.env.NODE_ENV ?? 'production',
  isJsDev: !!__DEV__,
});

export { Observe };

/** @deprecated Import the named `Observe` export instead. */
export default Observe;

export type {
  ObserveAttribute,
  ObserveAttributes,
  ObserveConfig,
  ObserveIntegrationsConfig,
  ObserveModule,
  ObserveModuleEvents,
  ObserveNavigationIntegrationConfig,
} from './types';
export { useObserve } from './useObserve';
