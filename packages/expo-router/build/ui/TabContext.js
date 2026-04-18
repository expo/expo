import { createContext } from 'react';
export const TabContext = createContext({});
/**
 * @hidden
 */
export const TabTriggerMapContext = createContext({});
/**
 * @hidden
 */
export const TabsDescriptorsContext = createContext({});
/**
 * @hidden
 */
export const TabsNavigatorContext = createContext(null);
/**
 * @hidden
 */
export const TabsStateContext = createContext({
    type: 'tab',
    preloadedRouteKeys: [],
    history: [],
    index: -1,
    key: '',
    stale: false,
    routeNames: [],
    routes: [],
});
//# sourceMappingURL=TabContext.js.map