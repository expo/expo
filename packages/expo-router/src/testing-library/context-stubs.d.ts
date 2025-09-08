import requireContext from './require-context-ponyfill';
import { NativeIntent } from '../types';
export type ReactComponent = () => React.ReactElement<any, any> | null;
export type NativeIntentStub = NativeIntent;
export type FileStub = (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | ReactComponent;
export type MemoryContext = Record<string, FileStub | NativeIntentStub> & {
    '+native-intent'?: NativeIntentStub;
};
export { requireContext };
export declare function inMemoryContext(context: MemoryContext): ((id: string) => NativeIntent | ReactComponent | (Record<string, unknown> & {
    default: ReactComponent;
    unstable_settings?: Record<string, any>;
}) | {
    default: NativeIntent | FileStub;
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