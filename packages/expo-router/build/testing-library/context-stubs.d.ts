/// <reference types="react" />
import requireContext from './require-context-ponyfill';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | ReactComponent;
export { requireContext };
export declare function inMemoryContext(context: Record<string, FileStub>): ((id: string) => ReactComponent | (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any> | undefined;
}) | {
    default: FileStub;
}) & {
    resolve: (key: string) => string;
    id: string;
    keys: () => string[];
};
export declare function requireContextWithOverrides(dir: string, overrides: Record<string, FileStub>): ((id: string) => any) & {
    keys: () => string[];
    resolve: (key: string) => string;
    id: string;
};
//# sourceMappingURL=context-stubs.d.ts.map