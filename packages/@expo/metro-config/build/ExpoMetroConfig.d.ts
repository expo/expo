import { MixedOutput, Module, ReadOnlyGraph, Reporter } from 'metro';
import { ConfigT as MetroConfig, InputConfigT } from 'metro-config';
import { INTERNAL_CALLSITES_REGEX } from './customizeFrame';
import { type CustomPlatform } from './utils/customPlatforms';
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
    /**
     * **Experimental:** Automatically resolve and configure the project for out-of-tree platforms.
     *
     * When setting this to `true`, it will try to resolve, configure, and enable `react-native-macos` and `react-native-windows`.
     * You can also provide a list of platform names, and their node package, to enable more out-of-tree platforms.
     * The platform packages have to be defined in your project's **package.json** file under `dependencies`.
     * If the platform package is missing from your `dependencies`, the out-of-tree platform will not be enabled.
     *
     * All out-of-tree platforms are not guaranteed to work with Expo, some features might not work.
     *
     * This is an experimental feature and may change in the future. The underlying implementation is subject to change.
     */
    unstable_outOfTreePlatforms?: true | CustomPlatform[];
}
export declare function createStableModuleIdFactory(root: string): (path: string, context?: {
    platform: string;
    environment?: string;
}) => number;
export declare function getDefaultConfig(projectRoot: string, { mode, isCSSEnabled, unstable_beforeAssetSerializationPlugins, unstable_outOfTreePlatforms, }?: DefaultConfigOptions): InputConfigT;
export { MetroConfig, INTERNAL_CALLSITES_REGEX };
export declare const EXPO_DEBUG: boolean;
