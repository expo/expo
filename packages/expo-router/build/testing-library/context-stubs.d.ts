import type { LoaderFunction } from 'expo-server';
import requireContext from './require-context-ponyfill';
import type { NativeIntent } from '../types';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeIntentStub = NativeIntent;
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
    loader?: LoaderFunction;
}) | ReactComponent;
export type MemoryContext = Record<string, FileStub | NativeIntentStub> & {
    '+native-intent'?: NativeIntentStub;
};
export { requireContext };
export declare function inMemoryContext(context: MemoryContext): ((id: string) => NativeIntent | ReactComponent | (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
    loader?: LoaderFunction;
}) | {
    default: NativeIntent | FileStub | undefined;
} | undefined) & {
    resolve: (key: string) => string;
    id: string;
    keys: () => string[];
};
export declare function normalizeKey(key: string): string;
export declare function findDuplicateKeys(normalizedKeys: readonly string[]): string[];
/**
 * Maps `requireContext` keys (`./name.ext`) to the extension-free, prefix-free
 * form used by `inMemoryContext` override keys (e.g. `_layout`, `nested/route`).
 *
 * The returned record is keyed by the normalized key and holds the original
 * require-context key, so a normalized key can be resolved back to the file it
 * came from. When two files normalize to the same key (e.g. both `index.jsx`
 * and `index.tsx`), it throws, matching the ambiguity `requireContext` cannot
 * represent.
 */
export declare function normalizeKeys(keys: string[]): Record<string, string>;
export declare function requireContextWithOverrides(dir: string, overrides: MemoryContext): ((id: string) => any) & {
    keys: () => string[];
    resolve: (key: string) => string;
    id: string;
};
//# sourceMappingURL=context-stubs.d.ts.map