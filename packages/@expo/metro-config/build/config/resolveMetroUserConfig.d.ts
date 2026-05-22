import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
export interface LoadMetroConfigParams {
    serverRoot: string;
    projectRoot: string;
    overrideConfigPath?: string | undefined;
}
type RawMetroConfig = ((baseConfig: MetroConfig) => Promise<MetroConfig>) | ((baseConfig: MetroConfig) => MetroConfig) | MetroConfig;
export interface ResolveMetroConfigResult {
    filepath: string;
    isEmpty: boolean;
    config: RawMetroConfig;
}
export declare function resolveMetroUserConfig(params: LoadMetroConfigParams): Promise<ResolveMetroConfigResult>;
export {};
