import React from 'react';
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
    fallback: React.ReactElement | null | ((props: AppMetricsErrorBoundaryFallbackProps) => React.ReactNode);
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
export declare class AppMetricsErrorBoundary extends React.Component<AppMetricsErrorBoundaryProps, State> {
    state: State;
    static getDerivedStateFromError(error: unknown): State;
    componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void;
    render(): React.ReactNode;
    private resetError;
}
export {};
//# sourceMappingURL=AppMetricsErrorBoundary.d.ts.map