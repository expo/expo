export { default } from './module';
export { AppMetricsRoot } from './AppMetricsRoot';
export * from './types';

// The `Session` class is declared (no runtime export from `Session.ts`) — it
// describes the shape of the native shared object the module hands back. To
// `instanceof`-check at runtime, reach through the default export:
// `AppMetrics.Session`.
export type { Session } from './Session';
