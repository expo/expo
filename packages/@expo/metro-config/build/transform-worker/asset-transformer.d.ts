import * as t from '@babel/types';
import { BabelTransformerArgs } from '@bycedric/metro/metro-babel-transformer';
export declare function transform({ filename, options, }: {
    filename: string;
    options: Pick<BabelTransformerArgs['options'], 'platform' | 'projectRoot' | 'customTransformOptions' | 'publicPath'>;
}, assetRegistryPath: string, assetDataPlugins: readonly string[]): Promise<{
    ast: t.File | import('@babel/core').ParseResult;
    reactClientReference?: string;
}>;
