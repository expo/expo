import './expect';
import { render } from '@testing-library/react-native';
import { FileStub } from './context-stubs';
export * from '@testing-library/react-native';
export declare let screen: RenderResult;
type RenderRouterOptions = Parameters<typeof render>[1] & {
    initialUrl?: any;
};
type RenderResult = ReturnType<typeof render> & {
    getPathname(): string;
    getSegments(): string[];
    getSearchParams(): Record<string, string | string[]>;
    getRootState(): Record<string, unknown>;
};
export declare function renderRouter(context?: string, options?: RenderRouterOptions): RenderResult;
export declare function renderRouter(context: Record<string, FileStub>, options?: RenderRouterOptions): RenderResult;
export declare function renderRouter(context: {
    appDir: string;
    overrides: Record<string, FileStub>;
}, options?: RenderRouterOptions): RenderResult;
//# sourceMappingURL=index.d.ts.map