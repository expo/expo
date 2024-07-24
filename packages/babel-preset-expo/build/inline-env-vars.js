"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoInlineEnvVars = void 0;
const debug = require('debug')('expo:babel:env-vars');
function expoInlineEnvVars(api) {
    const { types: t } = api;
    function isFirstInAssign(path) {
        return t.isAssignmentExpression(path.parent) && path.parent.left === path.node;
    }
    return {
        name: 'expo-inline-production-environment-variables',
        visitor: {
            MemberExpression(path, state) {
                const filename = state.filename;
                if (path.get('object').matchesPattern('process.env')) {
                    // @ts-expect-error: missing types
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key) &&
                        !isFirstInAssign(path) &&
                        key.value.startsWith('EXPO_PUBLIC_')) {
                        debug('Inlining environment variable in %s: %s', filename, key.value);
                        path.replaceWith(t.valueToNode(process.env[key.value]));
                    }
                }
            },
        },
    };
}
exports.expoInlineEnvVars = expoInlineEnvVars;
