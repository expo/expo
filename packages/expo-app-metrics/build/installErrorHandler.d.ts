/**
 * Installs a handler for unhandled JavaScript errors by wrapping React Native's
 * `global.ErrorUtils` global handler. The error is reported to the native module (recorded as an
 * `exception` log event following OpenTelemetry's exception conventions), then the
 * previously-installed handler runs so React Native's default behavior (red box in development,
 * fatal termination in production) is unchanged.
 *
 * Idempotent: only the first call installs. Called automatically when `expo-app-metrics` is
 * imported, so capture is live as early as the app pulls the module in.
 */
export declare function installErrorHandler(): void;
//# sourceMappingURL=installErrorHandler.d.ts.map