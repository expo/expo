"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoInlineEnvVars = expoInlineEnvVars;
const core_1 = require("@babel/core");
const common_1 = require("./common");
const debug = require('debug')('expo:babel:env-vars');
function expoInlineEnvVars(api) {
    const isProduction = api.caller(common_1.getIsProd);
    function isFirstInAssign(path) {
        return core_1.types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
    }
    let addEnvImport;
    const publicEnvVars = new Set();
    return {
        name: 'expo-inline-or-reference-env-vars',
        pre(file) {
            const addNamedImportOnce = (0, common_1.createAddNamedImportOnce)(core_1.types);
            addEnvImport = () => {
                return addNamedImportOnce(file.path, 'env', 'expo/virtual/env');
            };
        },
        visitor: {
            MemberExpression(path, state) {
                const filename = state.filename;
                if (path.get('object').matchesPattern('process.env')) {
                    // @ts-expect-error
                    const key = path.toComputedKey();
                    if (core_1.types.isStringLiteral(key) &&
                        !isFirstInAssign(path) &&
                        key.value.startsWith('EXPO_PUBLIC_')) {
                        const envVar = key.value;
                        debug(`${isProduction ? 'Inlining' : 'Referencing'} environment variable in %s: %s`, filename, envVar);
                        publicEnvVars.add(envVar);
                        if (isProduction) {
                            path.replaceWith(core_1.types.valueToNode(process.env[envVar]));
                        }
                        else {
                            path.replaceWith(core_1.types.memberExpression(addEnvImport(), core_1.types.identifier(envVar)));
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
