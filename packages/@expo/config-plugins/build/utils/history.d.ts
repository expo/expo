import { ExpoConfig } from '@expo/config-types';
import { ModPlatform } from '../Plugin.types';
export declare type PluginHistoryItem = {
    name: string;
    version: string;
    platform?: ModPlatform;
};
export declare function getHistoryItem(config: Pick<ExpoConfig, '_internal'>, name: string): PluginHistoryItem | null;
export declare function addHistoryItem(config: ExpoConfig, item: Omit<PluginHistoryItem, 'version'> & {
    version?: string;
}): ExpoConfig;
