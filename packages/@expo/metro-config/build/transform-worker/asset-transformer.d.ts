import { BabelTransformerArgs } from 'metro-babel-transformer';
export declare function transform({ filename, options }: BabelTransformerArgs, assetRegistryPath: string, assetDataPlugins: readonly string[]): Promise<{
    ast: import("@babel/parser").ParseResult<import("@babel/types").File>;
}>;
