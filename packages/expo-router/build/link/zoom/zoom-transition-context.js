'use client';
import { createContext } from 'react';
export const ZoomTransitionSourceContext = createContext(undefined);
export const ZoomTransitionTargetContext = createContext({
    identifier: null,
    dismissalBoundsRect: null,
    setDismissalBoundsRect: () => { },
    addEnabler: () => { },
    removeEnabler: () => { },
    hasEnabler: false,
});
//# sourceMappingURL=zoom-transition-context.js.map