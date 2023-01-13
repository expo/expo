import type { BabelTransformer, BabelTransformerArgs } from 'metro-babel-transformer';
export declare type Rule = {
    warn?: boolean;
    type?: 'module' | 'app';
    name?: string;
    test: ((args: BabelTransformerArgs) => boolean) | RegExp;
    transform: BabelTransformer['transform'];
};
/** Create a transformer that emulates Webpack's loader system. */
export declare function createMultiRuleTransformer({ getRuleType, rules, }: {
    getRuleType: (args: BabelTransformerArgs) => string;
    rules: Rule[];
}): BabelTransformer['transform'];
export declare const loaders: Record<string, (args: BabelTransformerArgs) => any>;
