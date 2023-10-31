export type BabelPresetExpoPlatformOptions = {
    disableFlowStripTypesTransform?: boolean;
    disableImportExportTransform?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
    /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
    useTransformReactJSXExperimental?: boolean;
};
export type BabelPresetExpoOptions = {
    lazyImports?: boolean;
    reanimated?: boolean;
    jsxRuntime?: 'classic' | 'automatic';
    jsxImportSource?: string;
    web?: BabelPresetExpoPlatformOptions;
    native?: BabelPresetExpoPlatformOptions;
};
export declare function hasModule(name: string): boolean;
/** Determine which bundler is being used. */
export declare function getBundler(caller: any): any;
export declare function getPlatform(caller: any): string | null;
export declare function getPossibleProjectRoot(caller: any): string | null;
export declare function getIsDev(caller: any): any;
