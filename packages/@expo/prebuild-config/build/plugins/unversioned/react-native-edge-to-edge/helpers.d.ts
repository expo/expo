import type { ExpoConfig } from '@expo/config-types';
import { EdgeToEdgePlugin } from './withEdgeToEdge';
export declare function edgeToEdgePluginIndex(config: ExpoConfig): number | null;
export declare function hasEnabledEdgeToEdge(config: ExpoConfig): boolean;
export declare function loadEdgeToEdgeConfigPlugin(projectRoot: string): EdgeToEdgePlugin | null;
