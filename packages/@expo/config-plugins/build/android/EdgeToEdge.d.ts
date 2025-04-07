import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withEdgeToEdge: ConfigPlugin;
export declare const withConfigureEdgeToEdgeEnforcement: ConfigPlugin<{
    disableEdgeToEdgeEnforcement: boolean;
}>;
export declare function hasEnabledEdgeToEdge(config: ExpoConfig): boolean;
