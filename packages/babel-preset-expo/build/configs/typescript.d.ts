import type { PluginItem } from '@babel/core';
declare function isTypeScriptSource(fileName: string | undefined | null): boolean;
export declare function getConfig(): {
    overrides: {
        test: typeof isTypeScriptSource;
        plugins: PluginItem[];
    }[];
};
export {};
