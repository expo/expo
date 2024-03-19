/// <reference types="react" />
import { LinkingOptions } from '@react-navigation/native';
import requireContext from './require-context-ponyfill';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type MemoryContext = {
    [key: string]: FileStub | NativeStub;
} & {
    '+native'?: NativeStub;
};
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | ReactComponent;
export type NativeStub = Partial<Pick<LinkingOptions<Record<string, unknown>>, 'getInitialURL' | 'prefixes' | 'subscribe'>>;
export { requireContext };
export declare function inMemoryContext(context: MemoryContext): ((id: string) => (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any> | undefined;
}) | ReactComponent | Partial<Pick<LinkingOptions<Record<string, unknown>>, "prefixes" | "getInitialURL" | "subscribe">> | {
    default: FileStub | Partial<Pick<LinkingOptions<Record<string, unknown>>, "prefixes" | "getInitialURL" | "subscribe">>;
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