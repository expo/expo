/**
 * Registry to handle import.meta functionality for React Native environment
 * Similar to how it works in the web, but adapted for the RN context
 * https://github.com/wintercg/import-meta-registry
 */
declare class ImportMetaRegistryClass {
    readonly url: string | null;
    readonly env: NodeJS.ProcessEnv;
}
export declare const ImportMetaRegistry: ImportMetaRegistryClass;
export {};
//# sourceMappingURL=ImportMetaRegistry.d.ts.map