/// <reference types="node" />
export declare function transformCssModuleWeb(props: {
    filename: string;
    src: string;
    options: {
        projectRoot: string;
        minify: boolean;
        dev: boolean;
        sourceMap: boolean;
    };
}): Promise<{
    output: string;
    css: Buffer;
    map: void | Buffer;
}>;
export declare function convertLightningCssToReactNativeWebStyleSheet(input: import('lightningcss').CSSModuleExports): {
    styles: Record<string, string>;
    reactNativeWeb: Record<string, any>;
    variables: Record<string, string>;
};
export declare function matchCssModule(filePath: string): boolean;
