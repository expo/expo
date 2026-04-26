import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import AppMetrics from './module';
/**
 * A root component that automatically marks the first render.
 * Wrap your app's root component with this to measure time to first render
 * without manually calling `AppMetrics.markFirstRender()`.
 */
export function AppMetricsRoot({ children }) {
    useEffect(() => {
        AppMetrics.markFirstRender();
    }, []);
    return _jsx(_Fragment, { children: children });
}
/**
 * Wraps a component with `AppMetricsRoot`.
 * Usage: `AppMetricsRoot.wrap(App);`
 */
AppMetricsRoot.wrap = function wrap(Component) {
    const Wrapped = (props) => (_jsx(AppMetricsRoot, { children: _jsx(Component, { ...props }) }));
    Wrapped.displayName = `AppMetricsRoot(${Component.displayName || Component.name || 'Component'})`;
    return Wrapped;
};
//# sourceMappingURL=AppMetricsRoot.js.map