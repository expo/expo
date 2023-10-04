export type BabelPresetExpoPlatformOptions = {
    useTransformReactJSXExperimental?: boolean;
    disableImportExportTransform?: boolean;
    withDevTools?: boolean;
    enableBabelRuntime?: boolean;
    unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
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
export declare function getPlatform(caller: any): any;
export declare function getIsDev(caller: any): any;
