'use client';
import * as React from 'react';
const MISSING_CONTEXT_ERROR = "Couldn't find an UnhandledLinkingContext context.";
export const UnhandledLinkingContext = React.createContext({
    get lastUnhandledLink() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
    get setLastUnhandledLink() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
});
UnhandledLinkingContext.displayName = 'UnhandledLinkingContext';
//# sourceMappingURL=UnhandledLinkingContext.js.map