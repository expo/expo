import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useEffect, useRef, useState } from 'react';
import { initListeners, isInitialized } from './init';
import { optionalRouter } from './router';
import { createRouterIntegrationStorage } from './storage';
export const ObserveRouterIntegrationContext = createContext(null);
export function ObserveRouterIntegrationProvider({ children }) {
    const [storage] = useState(() => isInitialized() ? createRouterIntegrationStorage() : null);
    const prevInitialized = useRef(isInitialized());
    if (prevInitialized.current !== isInitialized()) {
        throw new Error(`[expo-observe] Router integration was ${isInitialized() ? 'enabled' : 'disabled'} after application mounted. Call ExpoObserve.configure() before mounting AppMetricsRoot.`);
    }
    useEffect(() => {
        if (!storage || !optionalRouter)
            return;
        return initListeners(storage, optionalRouter.unstable_navigationEvents);
    }, [storage]);
    return (_jsx(ObserveRouterIntegrationContext.Provider, { value: storage, children: children }));
}
//# sourceMappingURL=ObserveRouterIntegrationProvider.js.map