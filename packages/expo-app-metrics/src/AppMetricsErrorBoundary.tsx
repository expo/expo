import React from 'react';

import AppMetrics from './module';

export type AppMetricsErrorBoundaryProps = {
  children: React.ReactNode;
  /**
   * What to render in place of the failed subtree after an error is caught. Pass an element to
   * render it instead of the broken children, keeping the app usable.
   *
   * Required, but explicitly pass `null` to opt out and render nothing in place of the subtree. The
   * boundary always renders something (the element or nothing), so a render error never propagates
   * past it; React boundaries can't re-throw to reproduce the original crash, so capture-only
   * boundaries aren't supported. Render-phase errors that no boundary catches are still recorded by
   * the global `ErrorUtils` handler `expo-app-metrics` installs on import.
   */
  fallback: React.ReactElement | null;
};

type State = {
  /**
   * Whether an error has been caught. Tracked separately from the value because a thrown value can
   * itself be falsy (e.g. `throw null`); keying "caught" off the value would make such a throw look
   * like a healthy state and re-render the children into an infinite loop.
   */
  hasError: boolean;
  /**
   * The caught value. Whatever was thrown, which is not necessarily an `Error` (code can throw a
   * string, `null`, or any value); only meaningful when `hasError` is `true`.
   */
  error: unknown;
};

/**
 * Error boundary that records React render-phase errors as `exception` log events (following
 * OpenTelemetry's exception conventions, same as the global `ErrorUtils` handler) and renders a
 * `fallback` in place of the subtree that threw.
 *
 * Render-phase errors don't reach `global.ErrorUtils` — React routes them through error boundaries —
 * so a boundary is the only way to observe them with the React component stack attached. Place one
 * around any subtree you want to keep capturing and recoverable; `AppMetricsRoot` mounts one
 * automatically when given an `errorBoundaryFallback`.
 *
 * The error is reported as non-fatal: the boundary renders the fallback and the app keeps running,
 * so it's a handled error, not a crash. Reporting runs in a `try/catch` so a failure inside
 * `reportError` can never become a new app-facing error.
 */
export class AppMetricsErrorBoundary extends React.Component<AppMetricsErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    // The thrown value may not be an `Error` (code can throw anything), so read its fields
    // defensively and fall back to `String(error)` for the message.
    const caught = error instanceof Error ? error : undefined;
    // React's component stack has a leading newline and indentation on each frame; trim the
    // surrounding whitespace so it reads cleanly.
    const componentStack = errorInfo?.componentStack?.trim();

    try {
      AppMetrics.reportError({
        source: 'errorBoundary',
        type: caught?.name,
        message: caught?.message ?? String(error),
        stacktrace: caught?.stack,
        componentStack,
        // The boundary renders the fallback and the app keeps running, so the error is handled, not
        // fatal (mirrors how Sentry marks error-boundary captures as `handled`).
        isFatal: false,
      });
    } catch {
      // Never let a reporting failure (e.g. a native module error) escape the boundary and become a
      // new app-facing error. Losing one report is strictly better than crashing.
    }
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return this.props.fallback;
  }
}
