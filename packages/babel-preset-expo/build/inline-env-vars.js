"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoInlineEnvVars = expoInlineEnvVars;
const common_1 = require("./common");
const debug = require('debug')('expo:babel:env-vars');
function expoInlineEnvVars(api) {
    const { types: t } = api;
    const isProduction = api.caller(common_1.getIsProd);
    function isFirstInAssign(path) {
        return t.isAssignmentExpression(path.parent) && path.parent.left === path.node;
    }
    let addEnvImport;
    const publicEnvVars = new Set();
    return {
        name: 'expo-inline-or-reference-env-vars',
        pre(file) {
            const addNamedImportOnce = (0, common_1.createAddNamedImportOnce)(t);
            addEnvImport = () => {
                return addNamedImportOnce(file.path, 'env', 'expo/virtual/env');
            };
        },
        visitor: {
            MemberExpression(path, state) {
                const filename = state.filename;
                if (path.get('object').matchesPattern('process.env')) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key) &&
                        !isFirstInAssign(path) &&
                        key.value.startsWith('EXPO_PUBLIC_')) {
                        const envVar = key.value;
                        debug(`${isProduction ? 'Inlining' : 'Referencing'} environment variable in %s: %s`, filename, envVar);
                        publicEnvVars.add(envVar);
                        if (isProduction) {
                            path.replaceWith(t.valueToNode(process.env[envVar]));
                        }
                        else {
                            path.replaceWith(t.memberExpression(addEnvImport(), t.identifier(envVar)));
                        }
                    }
                }
            },
        },
        post(file) {
            assertExpoMetadata(file.metadata);
            file.metadata.publicEnvVars = Array.from(publicEnvVars);
        },
    };
}
function assertExpoMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
        throw new Error('Expected Babel state.file.metadata to be an object');
    }
}
