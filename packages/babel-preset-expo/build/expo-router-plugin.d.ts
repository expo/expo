import { ConfigAPI, types } from '@babel/core';
/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_PUBLIC_USE_STATIC
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE
 */
export declare function expoRouterBabelPlugin(api: ConfigAPI & {
    types: typeof types;
}): {
    name: string;
    visitor: {
        MemberExpression(path: any, state: any): void;
    };
};
