import React from 'react';

import AppMetrics from './module';

/**
 * Arguments passed to a `fallback` render function.
 */
export type AppMetricsErrorBoundaryFallbackProps = {
  /**
   * The value the subtree threw. Usually an `Error`, but any value can be thrown.
   */
  error: unknown;
  /**
   * Clears the caught error and re-renders the children. Use it to offer a "try again" action;
   * the children re-mount, so they run from a clean state.
   */
  resetError: () => void;
};

export type AppMetricsErrorBoundaryProps = {
  children: React.ReactNode;
  /**
   * Rendered in place of the subtree after an error is caught. Provide one of:
   *
   * - a React element to render as-is,
   * - a function receiving the `error` and a `resetError` callback (to show details and offer retry),
   * - `null` to render nothing.
   *
   * A boundary can't re-throw to reproduce React Native's default crash, so it always renders one of
   * the above; there's no capture-only mode. Errors no boundary catches are still recorded by the
   * global `ErrorUtils` handler.
   */
  fallback:
    | React.ReactElement
    | null
    | ((props: AppMetricsErrorBoundaryFallbackProps) => React.ReactNode);
};

type State = {
  /**
   * Whether an error has been caught. Tracked separately from `error` because the thrown value can
   * itself be falsy (e.g. `throw null`), which would otherwise look like the healthy state.
   */
  hasError: boolean;
  /**
   * The value the subtree threw; only meaningful when `hasError` is `true`.
   */
  error: unknown;
};

/**
 * A React error boundary that records render-phase errors as non-fatal `exception` log events (with
 * the React component stack) and renders a `fallback` in place of the subtree that threw.
 *
 * Render-phase errors don't reach `global.ErrorUtils`, so a boundary is the only way to capture them
 * with the component stack. Place one around any subtree, or let `AppMetricsRoot` mount one via its
 * `errorBoundaryFallback` prop.
 */
export class AppMetricsErrorBoundary extends React.Component<AppMetricsErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    if (__DEV__) {
      console.warn('[expo-app-metrics] AppMetricsErrorBoundary caught a render error:', error);
    }

    // The thrown value may not be an `Error`, so read its fields defensively.
    const caught = error instanceof Error ? error : undefined;
    // React's component stack is newline-led and indented per frame; trim it, and treat an empty
    // result as absent so the native side omits the attribute.
    const componentStack = errorInfo.componentStack?.trim() || undefined;

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
    } catch (reportingError) {
      // An observability boundary must never become the source of a new error, so swallow a failure
      // inside `reportError`. Losing one report is better than crashing. Surface it in dev so a
      // dropped report is at least noticeable while developing.
      if (__DEV__) {
        console.warn('[expo-app-metrics] Failed to report a caught error:', reportingError);
      }
    }
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallback } = this.props;
    if (typeof fallback === 'function') {
      return fallback({ error: this.state.error, resetError: this.resetError });
    }
    return fallback;
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };
}
