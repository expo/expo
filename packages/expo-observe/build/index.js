import ExpoObserve from './module';
export { default as AppMetrics, AppMetricsRoot } from 'expo-app-metrics';
ExpoObserve.setBundleDefaults({
    environment: process.env.NODE_ENV ?? 'production',
    isJsDev: !!__DEV__,
});
export { default } from './module';
export * from './types';
//# sourceMappingURL=index.js.map