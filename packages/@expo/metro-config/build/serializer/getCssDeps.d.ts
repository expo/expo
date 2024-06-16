import type { Module } from 'metro';
import { SerialAsset } from './serializerAssets';
export type ReadOnlyDependencies<T = any> = ReadonlyMap<string, Module<T>>;
type Options = {
    processModuleFilter: (modules: Module) => boolean;
    assetPlugins: readonly string[];
    platform?: string | null;
    projectRoot: string;
    publicPath: string;
};
export type JSModule = Module<{
    data: {
        code: string;
        map: unknown;
        lineCount: number;
        css?: {
            code: string;
            map: unknown;
            lineCount: number;
            skipCache?: boolean;
        };
    };
    type: 'js/module';
}> & {
    unstable_transformResultKey?: string;
};
export declare function filterJsModules(dependencies: ReadOnlyDependencies, type: 'js/script' | 'js/module' | 'js/module/asset', { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>): JSModule[];
export declare function getCssSerialAssets<T extends any>(dependencies: ReadOnlyDependencies<T>, { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>): SerialAsset[];
export declare function fileNameFromContents({ filepath, src }: {
    filepath: string;
    src: string;
}): string;
export declare function getFileName(module: string): string;
export {};
