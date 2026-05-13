import { jsx as _jsx } from "react/jsx-runtime";
import { AppMetricsRoot } from 'expo-app-metrics';
import { ObserveProvider } from './ObserveProvider';
export function ObserveRoot({ children, ...props }) {
    return (_jsx(AppMetricsRoot, { ...props, children: _jsx(ObserveProvider, { children: children }) }));
}
ObserveRoot.wrap = function wrap(Component) {
    const Wrapped = (props) => (_jsx(ObserveRoot, { children: _jsx(Component, { ...props }) }));
    Wrapped.displayName = `ObserveRoot(${Component.displayName || Component.name || 'Component'})`;
    return Wrapped;
};
//# sourceMappingURL=ObserveRoot.js.map