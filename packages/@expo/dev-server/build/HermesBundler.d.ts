import type { ExpoConfig, Platform } from '@expo/config';
export declare function isEnableHermesManaged(expoConfig: ExpoConfig, platform: Platform): boolean;
interface HermesBundleOutput {
    hbc: Uint8Array;
    sourcemap: string;
}
export declare function buildHermesBundleAsync(projectRoot: string, code: string, map: string, optimize?: boolean): Promise<HermesBundleOutput>;
export declare function createHermesSourcemapAsync(projectRoot: string, sourcemap: string, hermesMapFile: string): Promise<string>;
export declare function parseGradleProperties(content: string): Record<string, string>;
export declare function maybeThrowFromInconsistentEngineAsync(projectRoot: string, configFilePath: string, platform: string, isHermesManaged: boolean): Promise<void>;
export declare function maybeInconsistentEngineAndroidAsync(projectRoot: string, isHermesManaged: boolean): Promise<boolean>;
export declare function maybeInconsistentEngineIosAsync(projectRoot: string, isHermesManaged: boolean): Promise<boolean>;
export declare function isHermesBytecodeBundleAsync(file: string): Promise<boolean>;
export declare function getHermesBytecodeBundleVersionAsync(file: string): Promise<number>;
export {};
