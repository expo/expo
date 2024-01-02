import type { ConfigPlugin, ModPlatform } from '../Plugin.types';
export interface PatchPluginProps {
    /** The directory to search for patch files in. */
    patchRoot?: string;
}
export declare function createPatchPlugin(platform: ModPlatform, props?: PatchPluginProps): ConfigPlugin;
