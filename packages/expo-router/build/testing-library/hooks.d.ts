export declare function renderHook<T>(renderCallback: () => T, routes?: string[], { initialUrl }?: {
    initialUrl?: string;
}): import("@testing-library/react-native").RenderHookResult<T, unknown>;
export declare function renderHookOnce<T>(renderCallback: () => T, routes?: string[], options?: {
    initialUrl?: string;
}): T;
//# sourceMappingURL=hooks.d.ts.map