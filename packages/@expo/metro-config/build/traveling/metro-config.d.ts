import type DefaultConfig from '@bycedric/metro/metro-config/src/defaults';
export declare function importMetroConfig(projectRoot: string): typeof import('@bycedric/metro/metro-config') & {
    getDefaultConfig: DefaultConfig;
};
