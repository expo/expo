'use client';
import * as React from 'react';
/**
 * Context which holds the required helpers needed to build nested navigators.
 */
export const NavigationBuilderContext = React.createContext({
    onDispatchAction: () => undefined,
    onOptionsChange: () => undefined,
    scheduleUpdate: () => {
        throw new Error("Couldn't find a context for scheduling updates.");
    },
    flushUpdates: () => {
        throw new Error("Couldn't find a context for flushing updates.");
    },
});
//# sourceMappingURL=NavigationBuilderContext.js.map