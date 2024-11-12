"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environmentRestrictedImportsPlugin = void 0;
const common_1 = require("./common");
const FORBIDDEN_CLIENT_IMPORTS = ['server-only'];
const FORBIDDEN_REACT_SERVER_IMPORTS = ['client-only'];
/** Prevent importing certain known imports in given environments. This is for sanity to ensure a module never accidentally gets imported unexpectedly. */
function environmentRestrictedImportsPlugin(api) {
    const { types: t } = api;
    const isReactServer = api.caller(common_1.getIsReactServer);
    const forbiddenPackages = isReactServer
        ? FORBIDDEN_REACT_SERVER_IMPORTS
        : FORBIDDEN_CLIENT_IMPORTS;
    function checkSource(source, path) {
        forbiddenPackages.forEach((forbiddenImport) => {
            if (source === forbiddenImport) {
                if (isReactServer) {
                    throw path.buildCodeFrameError(`Importing '${forbiddenImport}' module is not allowed in a React server bundle. Add the "use client" directive to this file or one of the parent modules to allow importing this module.`);
                }
                else {
                    throw path.buildCodeFrameError(`Importing '${forbiddenImport}' module is not allowed in a client component.`);
                }
            }
        });
    }
    return {
        name: 'expo-environment-restricted-imports-plugin',
        visitor: {
            ImportDeclaration(path) {
                checkSource(path.node.source.value, path);
            },
            ExportAllDeclaration(path) {
                if (path.node.source) {
                    checkSource(path.node.source.value, path);
                }
            },
            ExportNamedDeclaration(path) {
                if (path.node.source) {
                    checkSource(path.node.source.value, path);
                }
            },
            CallExpression(path) {
                if ((('name' in path.node.callee && path.node.callee.name === 'require') ||
                    (t.isMemberExpression(path.node.callee) &&
                        'name' in path.node.callee.property &&
                        ['resolveWeak', 'importAll', 'importDefault'].includes(path.node.callee.property.name))) &&
                    path.node.arguments.length > 0 &&
                    t.isStringLiteral(path.node.arguments[0])) {
                    checkSource(path.node.arguments[0].value, path);
                }
                // Handle dynamic import() syntax
                else if (path.node.callee.type === 'Import' &&
                    path.node.arguments.length > 0 &&
                    t.isStringLiteral(path.node.arguments[0])) {
                    checkSource(path.node.arguments[0].value, path);
                }
            },
        },
    };
}
exports.environmentRestrictedImportsPlugin = environmentRestrictedImportsPlugin;
