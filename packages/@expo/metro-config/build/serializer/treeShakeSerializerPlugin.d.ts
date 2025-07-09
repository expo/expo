import * as types from '@babel/types';
import { MixedOutput, Module, ReadOnlyGraph } from 'metro';
import { SerializerConfigT } from 'metro-config';
import { ExpoSerializerOptions } from './fork/baseJSBundle';
type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export declare function isModuleEmptyFor(ast?: types.File): boolean;
export declare function treeShakeSerializer(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: ExpoSerializerOptions): Promise<SerializerParameters>;
export {};
