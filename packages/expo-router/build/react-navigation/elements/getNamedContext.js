'use client';
import * as React from 'react';
const contexts = '__react_navigation__elements_contexts';
// We use a global variable to keep our contexts so that we can reuse same contexts across packages
globalThis[contexts] = globalThis[contexts] ?? new Map();
export function getNamedContext(name, initialValue) {
    let context = globalThis[contexts].get(name);
    if (context) {
        return context;
    }
    context = React.createContext(initialValue);
    context.displayName = name;
    globalThis[contexts].set(name, context);
    return context;
}
//# sourceMappingURL=getNamedContext.js.map