import { NodePath, types as t } from '@babel/core';
export declare type UniversalPlatformPluginOptions = {
    platform: string;
};
export default function (api: any, options: UniversalPlatformPluginOptions): {
    name: string;
    visitor: {
        IfStatement: (p: NodePath<t.IfStatement | t.ConditionalExpression>) => void;
        ConditionalExpression: (p: NodePath<t.IfStatement | t.ConditionalExpression>) => void;
        Identifier: (p: NodePath<t.Identifier>) => void;
        MemberExpression: (p: NodePath<t.MemberExpression>) => void;
        CallExpression(path: NodePath<t.CallExpression>): void;
    };
};
//# sourceMappingURL=index.d.ts.map