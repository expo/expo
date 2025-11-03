import type { Module, ReadOnlyDependencies } from '@expo/metro/metro/DeltaBundler/types';
import { SerialAsset } from './serializerAssets';
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
export declare function getCssSerialAssets<T extends any>(dependencies: ReadOnlyDependencies<T>, { projectRoot, entryFile }: Pick<Options, 'projectRoot'> & {
    entryFile: string;
}): SerialAsset[];
export declare function fileNameFromContents({ filepath, src }: {
    filepath: string;
    src: string;
}): string;
export declare function getFileName(module: string): string;
export {};
