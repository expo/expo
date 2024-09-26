import { BabelTransformerArgs } from 'metro-babel-transformer';
export declare function transform({ filename, options, }: {
    filename: string;
    options: Pick<BabelTransformerArgs['options'], 'platform' | 'projectRoot' | 'customTransformOptions' | 'publicPath'>;
}, assetRegistryPath: string, assetDataPlugins: readonly string[]): Promise<{
    ast: import('@babel/core').ParseResult;
    reactClientReference?: string;
}>;
