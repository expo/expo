import type { ServerFontResourceDescriptor } from 'expo-font';
import { type ReactNode } from 'react';
type CreateNodeResult = {
    headNodes?: ReactNode[];
    bodyNodes?: ReactNode[];
};
export declare function createInjectedCssAsNodes(hrefs: string[]): CreateNodeResult;
export declare function createInjectedInlineCssAsNodes(inlineCss?: {
    source: string;
    hmrId?: string;
}[]): CreateNodeResult;
export declare function createInjectedScriptAsNodes(srcs: string[]): CreateNodeResult;
export declare function getBootstrapContents({ hydrate, loadedData, }: {
    hydrate: boolean;
    loadedData: Record<string, unknown> | null;
}): string;
export declare function createInjectedFontsAsNodes(descriptors: ServerFontResourceDescriptor[]): ReactNode[];
export {};
//# sourceMappingURL=react.d.ts.map