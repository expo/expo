import { FileStub } from './context-stubs';
export type MockContextConfig = string | string[] | Record<string, FileStub> | {
    appDir: string;
    overrides: Record<string, FileStub>;
};
export declare function getMockConfig(context: MockContextConfig, metaOnly?: boolean): {
    initialRouteName?: string | undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
};
export declare function getMockContext(context: MockContextConfig): ((id: string) => any) & {
    keys: () => string[];
    resolve: (key: string) => string;
    id: string;
};
//# sourceMappingURL=mock-config.d.ts.map