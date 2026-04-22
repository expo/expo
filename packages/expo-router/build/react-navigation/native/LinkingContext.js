'use client';
import * as React from 'react';
const MISSING_CONTEXT_ERROR = "Couldn't find a LinkingContext context.";
export const LinkingContext = React.createContext({
    get options() {
        throw new Error(MISSING_CONTEXT_ERROR);
    },
});
LinkingContext.displayName = 'LinkingContext';
//# sourceMappingURL=LinkingContext.js.map