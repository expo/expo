import type { Reporter } from '@expo/metro/metro';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types.flow';
import type { ConfigT as MetroConfig, InputConfigT } from '@expo/metro/metro-config';
import { INTERNAL_CALLSITES_REGEX } from './customizeFrame';
export interface LoadOptions {
    config?: string;
    maxWorkers?: number;
    port?: number;
    reporter?: Reporter;
    resetCache?: boolean;
}
export interface DefaultConfigOptions {
    /** @deprecated */
    mode?: 'exotic';
    /**
     * **Experimental:** Enable CSS support for Metro web, and shim on native.
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change, and native support for CSS Modules may be added in the future during a non-major SDK release.
     */
    isCSSEnabled?: boolean;
    /**
     * **Experimental:** Modify premodules before a code asset is serialized
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change.
     */
    unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
        graph: ReadOnlyGraph<MixedOutput>;
        premodules: Module[];
        debugId?: string;
    }) => Module[])[];
}
export declare function createStableModuleIdFactory(root: string): (path: string, context?: {
    platform: string;
    environment?: string;
}) => number;
export declare function getDefaultConfig(projectRoot: string, { mode, isCSSEnabled, unstable_beforeAssetSerializationPlugins }?: DefaultConfigOptions): InputConfigT;
/** Use to access the Expo Metro transformer path */
export declare const unstable_transformerPath: string;
export declare const internal_supervisingTransformerPath: string;
export { MetroConfig, INTERNAL_CALLSITES_REGEX };
export declare const EXPO_DEBUG: boolean;
