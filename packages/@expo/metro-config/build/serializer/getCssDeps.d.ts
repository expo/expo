import type { Module } from 'metro';
import { SerialAsset } from './serializerAssets';
export type ReadOnlyDependencies<T = any> = Map<string, Module<T>>;
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
        };
    };
    type: 'js/module';
}>;
export declare function filterJsModules(dependencies: ReadOnlyDependencies, { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>): JSModule[];
export declare function getCssSerialAssets(dependencies: ReadOnlyDependencies, { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>): SerialAsset[];
export declare function fileNameFromContents({ filepath, src }: {
    filepath: string;
    src: string;
}): string;
export declare function getFileName(module: string): string;
export {};
