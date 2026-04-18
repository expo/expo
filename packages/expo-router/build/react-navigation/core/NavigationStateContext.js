'use client';
import * as React from 'react';
const MISSING_CONTEXT_ERROR = "Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? See https://reactnavigation.org/docs/getting-started for setup instructions.";
export const NavigationStateContext = React.createContext({
    isDefault: true,
    get getKey() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
    get setKey() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
    get getState() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
    get setState() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
    get getIsInitial() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
});
//# sourceMappingURL=NavigationStateContext.js.map