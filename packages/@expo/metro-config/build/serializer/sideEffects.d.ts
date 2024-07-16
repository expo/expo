import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
type AdvancedModule = Module<MixedOutput> & {
    sideEffects?: boolean | null;
};
export declare function hasSideEffectWithDebugTrace(options: SerializerOptions, graph: ReadOnlyGraph, value: AdvancedModule, parentTrace?: string[], checked?: Set<string>): [boolean | null, string[]];
export declare function _createSideEffectMatcher(dirRoot: string, packageJson: {
    sideEffects?: boolean | string[];
}, packageJsonPath?: string): (fp: string) => boolean | null;
export declare function isVirtualModule(path: string): boolean;
export {};
