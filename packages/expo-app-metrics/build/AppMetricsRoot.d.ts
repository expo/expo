import React from 'react';
import { type AppMetricsErrorBoundaryProps } from './AppMetricsErrorBoundary';
export type AppMetricsRootProps = {
    children: React.ReactNode;
    /**
     * When set, the app is wrapped in an `AppMetricsErrorBoundary` with this `fallback`, capturing
     * React render-phase errors at the root. Omit it and no boundary is mounted, so render errors keep
     * React Native's default behavior (they're still recorded by the global `ErrorUtils` handler, just
     * without the component stack). Pass `null` to capture but render nothing.
     *
     * To place a boundary deeper in the tree, use `AppMetricsErrorBoundary` directly.
     */
    errorBoundaryFallback?: AppMetricsErrorBoundaryProps['fallback'];
};
/**
 * A root component that automatically marks the first render, so you can measure time to first
 * render without calling `AppMetrics.markFirstRender()` yourself.
 */
export declare function AppMetricsRoot({ children, errorBoundaryFallback }: AppMetricsRootProps): import("react/jsx-runtime").JSX.Element;
export declare namespace AppMetricsRoot {
    var wrap: <P extends Record<string, unknown>>(Component: React.ComponentType<P>) => React.ComponentType<P>;
}
//# sourceMappingURL=AppMetricsRoot.d.ts.map