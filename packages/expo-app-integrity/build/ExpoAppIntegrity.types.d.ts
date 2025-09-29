import { NativeModule } from 'expo-modules-core/types';
/**
 * @hidden
 */
export interface ExpoAppIntegrityModule extends NativeModule {
    isSupported: boolean;
    generateKey(): Promise<string>;
    attestKey(keyId: string, challenge: string): Promise<string>;
    generateAssertion(keyId: string, challenge: string): Promise<string>;
    prepareIntegrityTokenProvider(cloudProjectNumber: string): Promise<void>;
    requestIntegrityCheck(requestHash: string): Promise<string>;
    isHardwareAttestationSupported(): Promise<boolean>;
    generateHardwareAttestedKey(keyAlias: string, challenge: string): Promise<void>;
    getAttestationCertificateChain(keyAlias: string): Promise<string[]>;
}
//# sourceMappingURL=ExpoAppIntegrity.types.d.ts.map