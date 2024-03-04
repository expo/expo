export type ScreenProps<TOptions extends Record<string, any> = Record<string, any>> = {
    /**
     * Name is required when used inside a Layout component.
     *
     * When used in a route, this can be an absolute path like `/(root)` to the parent route or a relative path like `../../` to the parent route.
     * This should not be used inside of a Layout component.
     * @example `/(root)` maps to a layout route `/app/(root).tsx`.
     */
    name?: string;
    initialParams?: Record<string, any>;
    options?: TOptions;
};
/** Component for setting the current screen's options dynamically. */
export declare function Screen<TOptions extends object = object>({ name, options }: ScreenProps<TOptions>): null;
//# sourceMappingURL=Screen.d.ts.map