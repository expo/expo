import { types as t, NodePath } from '@babel/core';
export declare type Options = {
    platform: string;
    mode: string;
};
export default function (api: any, options: Options): {
    name: string;
    visitor: {
        IfStatement: (p: NodePath<t.Conditional>) => void;
        ConditionalExpression: (p: NodePath<t.Conditional>) => void;
        Identifier: (p: NodePath<t.Identifier>) => void;
        MemberExpression: (p: NodePath<t.MemberExpression>) => void;
        CallExpression(path: NodePath<t.CallExpression>): void;
    };
};
//# sourceMappingURL=index.d.ts.map