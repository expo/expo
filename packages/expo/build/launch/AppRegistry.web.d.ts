/**
 * Minimal AppRegistry for web, forked from react-native-web.
 * Original author: Nicolas Gallagher (Meta Platforms, Inc.)
 * Uses `react-dom/client` directly to avoid a hard dependency on react-native-web.
 */
import type { ComponentType, ReactNode } from 'react';
type ComponentProvider = () => ComponentType<any>;
type AppParameters = {
    rootTag?: HTMLElement | null;
    initialProps?: Record<string, any>;
    hydrate?: boolean;
    callback?: () => void;
};
declare function registerComponent(appKey: string, componentProvider: ComponentProvider): string;
declare function getApplication(appKey: string, appParameters?: AppParameters): {
    element: ReactNode;
    getStyleElement: (props?: Record<string, any>) => ReactNode;
};
declare function runApplication(appKey: string, appParameters: AppParameters): any;
declare const _default: {
    registerComponent: typeof registerComponent;
    getApplication: typeof getApplication;
    runApplication: typeof runApplication;
};
export default _default;
//# sourceMappingURL=AppRegistry.web.d.ts.map