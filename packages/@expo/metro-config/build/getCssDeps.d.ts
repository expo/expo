import type { Module } from 'metro';
export type ReadOnlyDependencies<T = any> = Map<string, Module<T>>;
type Options = {
    processModuleFilter: (modules: Module) => boolean;
    assetPlugins: readonly string[];
    platform?: string | null;
    projectRoot: string;
    publicPath: string;
};
export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js';
    metadata: Record<string, string>;
};
export declare function getCssModules(dependencies: ReadOnlyDependencies, { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>): SerialAsset[];
export {};
