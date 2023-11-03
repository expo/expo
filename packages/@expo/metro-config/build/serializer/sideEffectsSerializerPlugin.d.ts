import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { SerializerParameters } from './withExpoSerializers';
export declare function hasSideEffect(graph: ReadOnlyGraph, value: Module<MixedOutput>, checked?: Set<string>): boolean;
export declare function sideEffectsSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;
