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
        data: import("./collect-dependencies").DependencyData;
        name: string;
    }>[];
    output: string;
    css: string;
    map: void | Uint8Array<ArrayBufferLike>;
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
        data: import("./collect-dependencies").DependencyData;
        name: string;
    }>[];
};
