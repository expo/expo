import { MemoryContext } from './context-stubs';
export type MockContextConfig = string | string[] | MemoryContext | {
    appDir: string;
    overrides: MemoryContext;
};
export declare function getMockConfig(context: MockContextConfig, metaOnly?: boolean): {
    initialRouteName: undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
};
export declare function getMockContext(context: MockContextConfig): ((id: string) => any) & {
    keys: () => string[];
    resolve: (key: string) => string;
    id: string;
};
//# sourceMappingURL=mock-config.d.ts.map