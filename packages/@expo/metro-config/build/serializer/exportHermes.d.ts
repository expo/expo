import { ExpoConfig } from '@expo/config';
export declare function importHermesCommandFromProject(): string;
export declare function isEnableHermesManaged(expoConfig: Partial<Pick<ExpoConfig, 'ios' | 'android' | 'jsEngine'>>, platform: string): boolean;
interface HermesBundleOutput {
    hbc: Uint8Array;
    sourcemap: string | null;
}
export declare function buildHermesBundleAsync({ code, map, minify, filename, }: {
    filename: string;
    code: string;
    map: string | null;
    minify?: boolean;
}): Promise<HermesBundleOutput>;
export declare function createHermesSourcemapAsync(sourcemap: string, hermesMapFile: string): Promise<string>;
export declare function parseGradleProperties(content: string): Record<string, string>;
export declare function isHermesBytecodeBundleAsync(file: string): Promise<boolean>;
export declare function getHermesBytecodeBundleVersionAsync(file: string): Promise<number>;
export {};
