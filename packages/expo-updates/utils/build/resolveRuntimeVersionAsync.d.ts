import * as Fingerprint from 'expo/fingerprint';
import { Workflow } from './workflow';
export declare function resolveRuntimeVersionAsync(projectRoot: string, platform: 'ios' | 'android', fingerprintOptions: Fingerprint.Options, otherOptions: {
    workflowOverride?: Workflow;
}): Promise<{
    runtimeVersion: string | null;
    fingerprintSources: Fingerprint.FingerprintSource[] | null;
    workflow: 'managed' | 'generic';
}>;
