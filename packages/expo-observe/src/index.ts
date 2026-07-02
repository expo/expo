import Observe from './module';

export { default as AppMetrics } from 'expo-app-metrics';
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
} from './types';
export { useObserve } from './useObserve';
