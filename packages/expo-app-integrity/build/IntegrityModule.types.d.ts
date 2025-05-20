import { NativeModule } from 'expo-modules-core/types';
export interface NativeIntegrityModule extends NativeModule {
    isAvailable(): boolean;
    generateKey(): string;
    attestKey(key: string, challenge: string): Promise<string>;
    generateAssertion(key: string, json: string): Promise<string>;
}
//# sourceMappingURL=IntegrityModule.types.d.ts.map