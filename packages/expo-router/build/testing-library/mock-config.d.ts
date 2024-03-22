import { MemoryContext } from './context-stubs';
export type MockContextConfig = string | string[] | MemoryContext | {
    appDir: string;
    overrides: MemoryContext;
};
export declare function getMockConfig(context: MockContextConfig, metaOnly?: boolean): {
    path?: string | undefined;
    screens: import("@react-navigation/core").PathConfigMap<Record<string, unknown>>;
    initialRouteName?: string | undefined;
} | undefined;
export declare function getMockContext(context: MockContextConfig): ((id: string) => any) & {
    keys: () => string[];
    resolve: (key: string) => string;
    id: string;
};
//# sourceMappingURL=mock-config.d.ts.map