import { Href, RouteParamInput, Routes } from './types';
export type Router = {
    /** Go back in the history. */
    back: () => void;
    /** If there's history that supports invoking the `back` function. */
    canGoBack: () => boolean;
    /** Navigate to the provided href using a push operation if possible. */
    push: <T extends string | object>(href: Href<T>) => void;
    /** Navigate to the provided href. */
    navigate: <T extends string | object>(href: Href<T>) => void;
    /** Navigate to route without appending to the history. */
    replace: <T extends string | object>(href: Href<T>) => void;
    /** Navigate to a screen with a stack lower than the current screen. Using the provided count if possible, otherwise 1. */
    dismiss: (count?: number) => void;
    /** Navigate to first screen within the lowest stack. */
    dismissAll: () => void;
    /** If there's history that supports invoking the `dismiss` and `dismissAll` function. */
    canDismiss: () => boolean;
    /** Update the current route query params. */
    setParams: <T extends Routes>(params: RouteParamInput<T>) => void;
};
export declare const router: Router;
//# sourceMappingURL=imperative-api.d.ts.map