import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
export declare function hasSideEffect(graph: ReadOnlyGraph, value: Module<MixedOutput>, checked?: Set<string>): boolean;
export declare function hasSideEffectWithDebugTrace(options: SerializerOptions, graph: ReadOnlyGraph, value: Module<MixedOutput>, parentTrace?: string[], checked?: Set<string>): [boolean, string[]];
