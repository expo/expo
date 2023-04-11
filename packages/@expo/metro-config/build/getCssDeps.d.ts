import type { Module } from 'metro';
export type ReadOnlyDependencies<T = any> = Map<string, Module<T>>;
type Options = {
    processModuleFilter: (modules: Module) => boolean;
    assetPlugins: readonly string[];
    platform?: string | null;
    projectRoot: string;
    publicPath: string;
};
export type CSSAsset = {
    originFilename: string;
    filename: string;
    source: string;
};
export declare function getCssModules(dependencies: ReadOnlyDependencies, { processModuleFilter, projectRoot }: Pick<Options, 'projectRoot' | 'processModuleFilter'>): string[][];
export {};
