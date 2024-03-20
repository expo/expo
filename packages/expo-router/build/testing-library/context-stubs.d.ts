/// <reference types="react" />
import requireContext from './require-context-ponyfill';
import { ExpoLinkingOptions } from '../getLinkingConfig';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeStub = Partial<ExpoLinkingOptions>;
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | ReactComponent;
export type MemoryContext = Record<string, FileStub | NativeStub> & {
    '+native'?: NativeStub;
};
export { requireContext };
export declare function inMemoryContext(context: MemoryContext): ((id: string) => Partial<ExpoLinkingOptions> | ReactComponent | (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any> | undefined;
}) | {
    default: Partial<ExpoLinkingOptions> | FileStub;
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