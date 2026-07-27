import type { ErrorHandlerCallback } from 'react-native';

import AppMetrics from './module';

let installed = false;

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
export function installErrorHandler(): void {
  if (installed) {
    return;
  }
  // `ErrorUtils` is a React Native global; it doesn't exist on web or before the runtime sets it up.
  if (typeof ErrorUtils === 'undefined') {
    return;
  }
  installed = true;

  const previousHandler = ErrorUtils.getGlobalHandler();
  const handler: ErrorHandlerCallback = (error, isFatal) => {
    try {
      AppMetrics.reportError({
        source: 'global',
        type: error?.name,
        message: error?.message ?? String(error),
        stacktrace: error?.stack,
        isFatal: isFatal ?? false,
      });
    } finally {
      // Always chain to the previous handler so React Native's behavior (red box in development,
      // fatal termination in production) is preserved even if recording the error throws.
      previousHandler?.(error, isFatal);
    }
  };
  ErrorUtils.setGlobalHandler(handler);
}
