import * as Fingerprint from '@expo/fingerprint';
export declare function createFingerprintAsync(projectRoot: string, platform: 'ios' | 'android', workflow: 'managed' | 'generic'): Promise<Fingerprint.Fingerprint>;
