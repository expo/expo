import { NativeModule } from 'expo-modules-core/types';
export interface ExpoAppIntegrityModule extends NativeModule {
    generateKey(): Promise<string>;
    attestKey(key: string, challenge: string): Promise<string>;
    generateAssertion(key: string, challenge: string): Promise<string>;
    prepareIntegrityTokenProvider(cloudProjectNumber: string): Promise<void>;
    requestIntegrityCheck(challenge: string): Promise<string>;
}
//# sourceMappingURL=ExpoAppIntegrity.types.d.ts.map