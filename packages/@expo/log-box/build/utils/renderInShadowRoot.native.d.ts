import type React from 'react';
/**
 * Native no-op for renderInShadowRoot.
 *
 * The real implementation lives in renderInShadowRoot.ts (used on web) and
 * depends on react-dom/client. This .native.ts variant ensures Metro never
 * tries to resolve react-dom on iOS/Android.
 */
export declare function renderInShadowRoot(_id: string, _element: React.ReactNode): {
    unmount: () => void;
};
