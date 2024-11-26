"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactClientReferencesPlugin = void 0;
/**
 * Copyright © 2024 650 Industries.
 */
const core_1 = require("@babel/core");
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
function reactClientReferencesPlugin(api) {
    const isReactServer = api.caller(common_1.getIsReactServer);
    return {
        name: 'expo-client-references',
        visitor: {
            Program(path, state) {
                const isUseClient = path.node.directives.some((directive) => directive.value.value === 'use client' ||
                    // Convert DOM Components to client proxies in React Server environments.
                    directive.value.value === 'use dom');
                // TODO: use server can be added to scopes inside of the file. https://github.com/facebook/react/blob/29fbf6f62625c4262035f931681c7b7822ca9843/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js#L55
                const isUseServer = path.node.directives.some((directive) => directive.value.value === 'use server');
                if (isUseClient && isUseServer) {
                    throw path.buildCodeFrameError("It's not possible to have both `use client` and `use server` directives in the same file.");
                }
                if (!isUseClient && !isUseServer) {
                    return;
                }
                const filePath = state.file.opts.filename;
                if (!filePath) {
                    // This can happen in tests or systems that use Babel standalone.
                    throw new Error('[Babel] Expected a filename to be set in the state');
                }
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                function iterateExports(callback, type) {
                    const exportNames = new Set();
                    // Collect all of the exports
                    path.traverse({
                        ExportNamedDeclaration(exportPath) {
                            if (exportPath.node.declaration) {
                                if (exportPath.node.declaration.type === 'VariableDeclaration') {
                                    exportPath.node.declaration.declarations.forEach((declaration) => {
                                        if (declaration.id.type === 'Identifier') {
                                            const exportName = declaration.id.name;
                                            exportNames.add(exportName);
                                            callback(exportName);
                                        }
                                    });
                                }
                                else if (exportPath.node.declaration.type === 'FunctionDeclaration') {
                                    const exportName = exportPath.node.declaration.id?.name;
                                    if (exportName) {
                                        exportNames.add(exportName);
                                        callback(exportName);
                                    }
                                }
                                else if (exportPath.node.declaration.type === 'ClassDeclaration') {
                                    const exportName = exportPath.node.declaration.id?.name;
                                    if (exportName) {
                                        exportNames.add(exportName);
                                        callback(exportName);
                                    }
                                }
                                else if (![
                                    'InterfaceDeclaration',
                                    'TSInterfaceDeclaration',
                                    'TSTypeAliasDeclaration',
                                    'TypeAlias',
                                ].includes(exportPath.node.declaration.type)) {
                                    // TODO: What is this type?
                                    console.warn(`[babel-preset-expo] Unsupported export specifier for "use ${type}":`, exportPath.node.declaration.type);
                                }
                            }
                            else {
                                exportPath.node.specifiers.forEach((specifier) => {
                                    if (core_1.types.isIdentifier(specifier.exported)) {
                                        const exportName = specifier.exported.name;
                                        exportNames.add(exportName);
                                        callback(exportName);
                                    }
                                    else {
                                        // TODO: What is this type?
                                        console.warn(`[babel-preset-expo] Unsupported export specifier for "use ${type}":`, specifier);
                                    }
                                });
                            }
                        },
                        ExportDefaultDeclaration() {
                            exportNames.add('default');
                            callback('default');
                        },
                    });
                    return exportNames;
                }
                // File starts with "use client" directive.
                if (isUseServer) {
                    if (isReactServer) {
                        // The "use server" transform for react-server is in a different plugin.
                        return;
                    }
                    // Handle "use server" in the client.
                    const proxyModule = [
                        `import { createServerReference } from 'react-server-dom-webpack/client';`,
                        `import { callServerRSC } from 'expo-router/rsc/internal';`,
                    ];
                    const getProxy = (exportName) => {
                        return `createServerReference(${JSON.stringify(`${outputKey}#${exportName}`)}, callServerRSC)`;
                    };
                    const pushProxy = (exportName) => {
                        if (exportName === 'default') {
                            proxyModule.push(`export default ${getProxy(exportName)};`);
                        }
                        else {
                            proxyModule.push(`export const ${exportName} = ${getProxy(exportName)};`);
                        }
                    };
                    // We need to add all of the exports to support `export * from './module'` which iterates the keys of the module.
                    // Collect all of the exports
                    const proxyExports = iterateExports(pushProxy, 'client');
                    // Clear the body
                    path.node.body = [];
                    path.node.directives = [];
                    path.pushContainer('body', core_1.template.ast(proxyModule.join('\n')));
                    assertExpoMetadata(state.file.metadata);
                    // Store the proxy export names for testing purposes.
                    state.file.metadata.proxyExports = [...proxyExports];
                    // Save the server action reference in the metadata.
                    state.file.metadata.reactServerReference = outputKey;
                }
                else if (isUseClient) {
                    if (!isReactServer) {
                        // Do nothing for "use client" on the client.
                        return;
                    }
                    // HACK: Mock out the polyfill that doesn't run through the normal bundler pipeline.
                    if (filePath.endsWith('@react-native/js-polyfills/console.js') ||
                        filePath.endsWith('@react-native\\js-polyfills\\console.js')) {
                        // Clear the body
                        path.node.body = [];
                        path.node.directives = [];
                        return;
                    }
                    // We need to add all of the exports to support `export * from './module'` which iterates the keys of the module.
                    const proxyModule = [
                        `const proxy = /*@__PURE__*/ require("react-server-dom-webpack/server").createClientModuleProxy(${JSON.stringify(outputKey)});`,
                        `module.exports = proxy;`,
                    ];
                    const getProxy = (exportName) => {
                        return `(/*@__PURE__*/ proxy[${JSON.stringify(exportName)}])`;
                    };
                    const pushProxy = (exportName) => {
                        if (exportName === 'default') {
                            proxyModule.push(`export default ${getProxy(exportName)};`);
                        }
                        else {
                            proxyModule.push(`export const ${exportName} = ${getProxy(exportName)};`);
                        }
                    };
                    // Collect all of the exports
                    const proxyExports = iterateExports(pushProxy, 'client');
                    // Clear the body
                    path.node.body = [];
                    path.node.directives = [];
                    path.pushContainer('body', core_1.template.ast(proxyModule.join('\n')));
                    assertExpoMetadata(state.file.metadata);
                    // Store the proxy export names for testing purposes.
                    state.file.metadata.proxyExports = [...proxyExports];
                    // Save the client reference in the metadata.
                    state.file.metadata.reactClientReference = outputKey;
                }
            },
        },
    };
}
exports.reactClientReferencesPlugin = reactClientReferencesPlugin;
function assertExpoMetadata(metadata) {
    if (metadata && typeof metadata === 'object') {
        return;
    }
    throw new Error('Expected Babel state.file.metadata to be an object');
}
