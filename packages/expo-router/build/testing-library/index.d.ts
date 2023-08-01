import './expect';
import { render } from '@testing-library/react-native';
import { FileStub } from './context-stubs';
export * from '@testing-library/react-native';
type RenderRouterOptions = Parameters<typeof render>[1] & {
    initialUrl?: any;
};
type Result = ReturnType<typeof render> & {
    getPathname(): string;
    getSegments(): string[];
    getSearchParams(): Record<string, string | string[]>;
};
export declare function renderRouter(context?: string, options?: RenderRouterOptions): Result;
export declare function renderRouter(context: Record<string, FileStub>, options?: RenderRouterOptions): Result;
export declare function renderRouter(context: {
    appDir: string;
    overrides: Record<string, FileStub>;
}, options?: RenderRouterOptions): Result;
//# sourceMappingURL=index.d.ts.map