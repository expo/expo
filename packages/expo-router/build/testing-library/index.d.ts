import './expect';
import { render } from '@testing-library/react-native';
import { FileStub } from './context-stubs';
export * from '@testing-library/react-native';
type RenderRouterOptions = Parameters<typeof render>[1] & {
    initialUrl?: any;
};
type Result = ReturnType<typeof render> & {
    getPathname(): string;
    getPathnameWithParams(): string;
    getSegments(): string[];
    getSearchParams(): Record<string, string | string[]>;
};
export type MockContextConfig = string | string[] | Record<string, FileStub> | {
    appDir: string;
    overrides: Record<string, FileStub>;
};
export declare function getMockConfig(context: MockContextConfig): {
    initialRouteName?: string | undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
};
export declare function getMockContext(context: MockContextConfig): import("../types").RequireContext;
export declare function renderRouter(context?: MockContextConfig, { initialUrl, ...options }?: RenderRouterOptions): Result;
//# sourceMappingURL=index.d.ts.map