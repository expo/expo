import { ConfigAPI } from '@babel/core';
export declare function expoInlineManifestPlugin(api: ConfigAPI & {
    types: any;
}): {
    name: string;
    visitor: {
        MemberExpression(path: any, state: any): void;
    };
};
