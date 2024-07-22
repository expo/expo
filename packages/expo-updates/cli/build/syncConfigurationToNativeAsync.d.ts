import { Workflow } from '../../utils/build/workflow';
type SyncConfigurationToNativeOptions = {
    projectRoot: string;
    platform: 'ios' | 'android';
    workflow: Workflow;
};
/**
 * Synchronize updates configuration to native files. This needs to do essentially the same thing as `withUpdates`
 */
export declare function syncConfigurationToNativeAsync(options: SyncConfigurationToNativeOptions): Promise<void>;
export {};
