import type { TransformResult, Warning } from 'lightningcss';
export declare function transformCssModuleWeb(props: {
    filename: string;
    src: string;
    options: {
        projectRoot: string;
        minify: boolean;
        dev: boolean;
        sourceMap: boolean;
        reactServer: boolean;
    };
}): Promise<{
    externalImports: {
        url: string;
        supports: string | null;
        media: string | null;
    }[];
    code: string;
    dependencies: Readonly<{
        data: Readonly<{
            key: string;
            asyncType: import("./collect-dependencies").AsyncDependencyType | null;
            isOptional?: boolean | undefined;
            locs: readonly import("@babel/types").SourceLocation[];
            contextParams?: Readonly<{
                recursive: boolean;
                filter: Readonly<Readonly<{
                    pattern: string;
                    flags: string;
                }>>;
                mode: "sync" | "eager" | "lazy" | "lazy-once";
            }> | undefined;
            exportNames: string[];
            css?: {
                url: string;
                supports: string | null;
                media: string | null;
            } | undefined;
        }>;
        name: string;
    }>[];
    output: string;
    css: string;
    map: void | Uint8Array;
}>;
export declare function convertLightningCssToReactNativeWebStyleSheet(input: import('lightningcss').CSSModuleExports): {
    styles: Record<string, string>;
    reactNativeWeb: Record<string, any>;
    variables: Record<string, string>;
};
export declare function matchCssModule(filePath: string): boolean;
export declare function printCssWarnings(filename: string, code: string, warnings?: Warning[]): void;
export declare function collectCssImports(filename: string, originalCode: string, code: string, cssResults: Pick<TransformResult, 'dependencies' | 'exports'>): {
    externalImports: {
        url: string;
        supports: string | null;
        media: string | null;
    }[];
    code: string;
    dependencies: Readonly<{
        data: Readonly<{
            key: string;
            asyncType: import("./collect-dependencies").AsyncDependencyType | null;
            isOptional?: boolean | undefined;
            locs: readonly import("@babel/types").SourceLocation[];
            contextParams?: Readonly<{
                recursive: boolean;
                filter: Readonly<Readonly<{
                    pattern: string;
                    flags: string;
                }>>;
                mode: "sync" | "eager" | "lazy" | "lazy-once";
            }> | undefined;
            exportNames: string[];
            css?: {
                url: string;
                supports: string | null;
                media: string | null;
            } | undefined;
        }>;
        name: string;
    }>[];
};
