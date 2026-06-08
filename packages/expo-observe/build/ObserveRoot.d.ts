import { AppMetricsRoot } from 'expo-app-metrics';
import type { ComponentProps, ReactNode } from 'react';
type AppMetricsRootProps = ComponentProps<typeof AppMetricsRoot>;
export declare function ObserveRoot({ children, ...props }: AppMetricsRootProps & {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare namespace ObserveRoot {
    var wrap: <P extends Record<string, unknown>>(Component: React.ComponentType<P>) => React.ComponentType<P>;
}
export {};
//# sourceMappingURL=ObserveRoot.d.ts.map