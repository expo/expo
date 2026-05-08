import ExpoObserve from './module';
export { default as AppMetrics } from 'expo-app-metrics';
export { ObserveRoot } from './ObserveRoot';
export { useObserve } from './useObserve';
ExpoObserve.setBundleDefaults({
    environment: process.env.NODE_ENV ?? 'production',
    isJsDev: !!__DEV__,
});
export { default } from './module';
export * from './types';
//# sourceMappingURL=index.js.map