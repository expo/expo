import { NativeModule } from 'expo-modules-core/types';
/**
 * @hidden
 */
export interface ExpoAppIntegrityModule extends NativeModule {
    isSupported: boolean;
    generateKeyAsync(): Promise<string>;
    attestKeyAsync(keyId: string, challenge: string): Promise<string>;
    generateAssertionAsync(keyId: string, challenge: string): Promise<string>;
    prepareIntegrityTokenProviderAsync(cloudProjectNumber: string): Promise<void>;
    requestIntegrityCheckAsync(requestHash: string): Promise<string>;
    isHardwareAttestationSupportedAsync(): Promise<boolean>;
    generateHardwareAttestedKeyAsync(keyAlias: string, challenge: string): Promise<void>;
    getAttestationCertificateChainAsync(keyAlias: string): Promise<string[]>;
}
//# sourceMappingURL=ExpoAppIntegrity.types.d.ts.map