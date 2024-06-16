/// <reference types="react" />
import requireContext from './require-context-ponyfill';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeIntentStub = {
    redirectSystemPath?: (event: {
        path: string | null;
        initial: boolean;
    }) => Promise<string | null | undefined> | string | null | undefined;
    subscribe?: (listener: (path: string) => void) => Promise<() => void | void> | (() => void) | void;
};
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | ReactComponent;
export type MemoryContext = Record<string, FileStub | NativeIntentStub> & {
    '+native-intent'?: NativeIntentStub;
};
export { requireContext };
export declare function inMemoryContext(context: MemoryContext): ((id: string) => NativeIntentStub | ReactComponent | (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any> | undefined;
}) | {
    default: NativeIntentStub | FileStub;
}) & {
    resolve: (key: string) => string;
    id: string;
    keys: () => string[];
};
export declare function requireContextWithOverrides(dir: string, overrides: MemoryContext): ((id: string) => any) & {
    keys: () => string[];
    resolve: (key: string) => string;
    id: string;
};
//# sourceMappingURL=context-stubs.d.ts.map