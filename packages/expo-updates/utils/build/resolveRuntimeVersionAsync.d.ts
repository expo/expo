import { FingerprintSource } from '@expo/fingerprint';
export declare function resolveRuntimeVersionAsync(projectRoot: string, platform: 'ios' | 'android'): Promise<{
    runtimeVersion: string | null;
    fingerprintSources: FingerprintSource[] | null;
}>;
