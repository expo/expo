import { NativeModule } from 'expo-modules-core/types';

/**
 * @hidden
 */
export interface ExpoAppIntegrityModule extends NativeModule {
  // iOS
  isSupported: boolean;
  generateKey(): Promise<string>;
  attestKey(keyId: string, challenge: string): Promise<string>;
  generateAssertion(keyId: string, challenge: string): Promise<string>;
  // Android
  prepareIntegrityTokenProvider(cloudProjectNumber: string): Promise<void>;
  requestIntegrityCheck(requestHash: string): Promise<string>;
}
