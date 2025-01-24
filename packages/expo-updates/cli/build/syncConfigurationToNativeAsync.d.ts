import { ModPlatform } from '@expo/config-plugins';
import { Workflow } from '../../utils/build/workflow';
type SyncConfigurationToNativeOptions = {
    projectRoot: string;
    platform: ModPlatform;
    workflow: Workflow;
};
/**
 * Synchronize updates configuration to native files. This needs to do essentially the same thing as `withUpdates`
 */
export declare function syncConfigurationToNativeAsync(options: SyncConfigurationToNativeOptions): Promise<void>;
export {};
