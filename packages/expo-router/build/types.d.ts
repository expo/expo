import type { Href } from './link/href';
export interface RequireContext {
    /** Return the keys that can be resolved. */
    keys(): string[];
    (id: string): any;
    <T>(id: string): T;
    /** **Unimplemented:** Return the module identifier for a user request. */
    resolve(id: string): string;
    /** **Unimplemented:** Readable identifier for the context module. */
    id: string;
}
/** The list of input keys will become optional, everything else will remain the same. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Router = {
    /** Navigate to the provided href using a dismiss operation if possible. */
    push: (href: Href) => void;
    /** Navigate to the provided href using a push operation if possible. */
    dismiss: (count?: number) => void;
    /** Navigate to the provided href. */
    navigate: (href: Href) => void;
    /** Navigate to route without appending to the history. */
    replace: (href: Href) => void;
    /** Navigate to first screen within the lowest stack */
    dismissAll: () => void;
    /** Go back in the history. */
    back: () => void;
    /** If there's history that supports invoking the `back` function. */
    canGoBack: () => boolean;
    /** If there's history that supports invoking the `dismiss` and `dismissAll` function. */
    canDismiss: () => boolean;
    /** Update the current route query params. */
    setParams: (params?: Record<string, string>) => void;
};
//# sourceMappingURL=types.d.ts.map