import { NavigationOptions } from './global-state/routing';
import { Href, Route, RouteInputParams } from './types';
export type Router = {
    /** Go back in the history. */
    back: () => void;
    /** If there's history that supports invoking the `back` function. */
    canGoBack: () => boolean;
    /** Navigate to the provided href using a push operation if possible. */
    push: (href: Href, options?: NavigationOptions) => void;
    /** Navigate to the provided href. */
    navigate: (href: Href, options?: NavigationOptions) => void;
    /** Navigate to route without appending to the history. */
    replace: (href: Href, options?: NavigationOptions) => void;
    /** Navigate to a screen with a stack lower than the current screen. Using the provided count if possible, otherwise 1. */
    dismiss: (count?: number) => void;
    /** Navigate to first screen within the lowest stack. */
    dismissAll: () => void;
    /** If there's history that supports invoking the `dismiss` and `dismissAll` function. */
    canDismiss: () => boolean;
    /** Update the current route query params. */
    setParams: <T extends Route>(params: Partial<RouteInputParams<T>>) => void;
};
/**
 * @hidden
 */
export declare const router: Router;
//# sourceMappingURL=imperative-api.d.ts.map