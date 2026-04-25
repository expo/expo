import React from 'react';
/**
 * A root component that automatically marks the first render.
 * Wrap your app's root component with this to measure time to first render
 * without manually calling `AppMetrics.markFirstRender()`.
 */
export declare function AppMetricsRoot({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare namespace AppMetricsRoot {
    var wrap: <P extends Record<string, unknown>>(Component: React.ComponentType<P>) => React.ComponentType<P>;
}
//# sourceMappingURL=AppMetricsRoot.d.ts.map