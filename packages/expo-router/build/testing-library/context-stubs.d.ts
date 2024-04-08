/// <reference types="react" />
import requireContext from './require-context-ponyfill';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeStub = {
    redirectSystemPath(event: {
        path: string;
        initial: boolean;
    }): Promise<string | null | undefined> | string | null | undefined;
};
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | ReactComponent;
export type MemoryContext = Record<string, FileStub | NativeStub> & {
    '+native'?: NativeStub;
};
export { requireContext };
export declare function inMemoryContext(context: MemoryContext): ((id: string) => NativeStub | ReactComponent | (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any> | undefined;
}) | {
    default: NativeStub | FileStub;
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