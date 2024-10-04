type PostCSSInputConfig = {
    plugins?: any[];
    from?: string;
    to?: string;
    syntax?: string;
    map?: boolean;
    parser?: string;
    stringifier?: string;
};
export declare function transformPostCssModule(projectRoot: string, { src, filename }: {
    src: string;
    filename: string;
}): Promise<string>;
export declare function pluginFactory(): (plugins?: any) => Map<string, any>;
export declare function resolvePostcssConfig(projectRoot: string): PostCSSInputConfig | null;
export declare function getPostcssConfigHash(projectRoot: string): string | null;
export {};
