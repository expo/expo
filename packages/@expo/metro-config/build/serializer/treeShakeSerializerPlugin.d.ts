import * as types from '@babel/types';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { SerializerConfigT } from 'metro-config';
type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
type AdvancedMixedOutput = {
    readonly data: {
        ast?: types.File;
        code: string;
        hasCjsExports?: boolean;
        modules?: {
            imports: {
                source: string;
                key: string | null;
                specifiers: {
                    type: string;
                    importedName: string | null;
                    localName: string;
                    exportedName?: string;
                }[];
                cjs?: boolean;
                async?: boolean;
                weak?: boolean;
                star?: boolean;
            }[];
        };
    };
    readonly type: string;
};
export declare function isModuleEmptyFor(ast?: types.File): boolean;
export declare function treeShakeSerializer(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): Promise<SerializerParameters>;
export declare function accessAst(output: AdvancedMixedOutput): types.File | undefined;
export declare function isShakingEnabled(graph: ReadOnlyGraph, options: SerializerOptions): boolean;
export {};
