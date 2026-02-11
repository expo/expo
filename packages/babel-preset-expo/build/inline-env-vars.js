"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoInlineEnvVars = expoInlineEnvVars;
const common_1 = require("./common");
const debug = require('debug')('expo:babel:env-vars');
function expoInlineEnvVars(api) {
    const { types: t } = api;
    const isProduction = api.caller(common_1.getIsProd);
    function isProcessEnv(path) {
        const { object } = path.node;
        if (!t.isMemberExpression(object) ||
            !t.isIdentifier(object.object) ||
            object.object.name !== 'process') {
            return false;
        }
        const { property } = object;
        if (t.isIdentifier(property)) {
            return property.name === 'env';
        }
        else if (t.isStringLiteral(property)) {
            return property.value === 'env';
        }
        else {
            return false;
        }
    }
    function toMemberProperty(path) {
        const { property } = path.node;
        if (t.isStringLiteral(property)) {
            return property.value;
        }
        else if (t.isIdentifier(property)) {
            return property.name;
        }
        else {
            return undefined;
        }
    }
    /** If the `path.node` being assigned to (`left = right`) */
    function isAssignment(path) {
        return t.isAssignmentExpression(path.parent) && path.parent.left === path.node;
    }
    function memberExpressionVisitor(path, state) {
        if (!isProcessEnv(path) || isAssignment(path))
            return;
        const key = toMemberProperty(path);
        if (key != null && key.startsWith('EXPO_PUBLIC_')) {
            debug(`${isProduction ? 'Inlining' : 'Referencing'} environment variable in %s: %s`, state.filename, key);
            publicEnvVars.add(key);
            if (isProduction) {
                path.replaceWith(t.valueToNode(process.env[key]));
            }
            else {
                path.replaceWith(t.memberExpression(addEnvImport(), t.identifier(key)));
            }
        }
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
            OptionalMemberExpression: memberExpressionVisitor,
            MemberExpression: memberExpressionVisitor,
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
