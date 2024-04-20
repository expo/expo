import * as Fingerprint from '@expo/fingerprint';
export declare function resolveRuntimeVersionAsync(projectRoot: string, platform: 'ios' | 'android', options: Fingerprint.Options): Promise<{
    runtimeVersion: string | null;
    fingerprintSources: Fingerprint.FingerprintSource[] | null;
    workflow: 'managed' | 'generic';
}>;
