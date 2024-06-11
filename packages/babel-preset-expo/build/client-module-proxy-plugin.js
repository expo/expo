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
function reactClientReferencesPlugin() {
    return {
        name: 'expo-client-references',
        visitor: {
            Program(path, state) {
                const isUseClient = path.node.directives.some((directive) => directive.value.value === 'use client');
                // TODO: use server can be added to scopes inside of the file. https://github.com/facebook/react/blob/29fbf6f62625c4262035f931681c7b7822ca9843/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js#L55
                const isUseServer = path.node.directives.some((directive) => directive.value.value === 'use server');
                if (isUseClient && isUseServer) {
                    throw path.buildCodeFrameError("It's not possible to have both `use client` and `use server` directives in the same file.");
                }
                const filePath = state.file.opts.filename;
                if (!filePath) {
                    // This can happen in tests or systems that use Babel standalone.
                    throw new Error('[Babel] Expected a filename to be set in the state');
                }
                // File starts with "use client" directive.
                if (!isUseClient) {
                    // Do nothing for code that isn't marked as a client component.
                    return;
                }
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                // We need to add all of the exports to support `export * from './module'` which iterates the keys of the module.
                const proxyModule = [
                    `const proxy = /*@__PURE__*/ require("react-server-dom-webpack/server").createClientModuleProxy(${JSON.stringify(outputKey)});`,
                    `module.exports = proxy;`,
                ];
                const getProxy = (exportName) => {
                    return `(/*@__PURE__*/ proxy[${JSON.stringify(exportName)}])`;
                };
                const proxyExports = new Set();
                const pushProxy = (exportName) => {
                    proxyExports.add(exportName);
                    if (exportName === 'default') {
                        proxyModule.push(`export default ${getProxy(exportName)};`);
                    }
                    else {
                        proxyModule.push(`export const ${exportName} = ${getProxy(exportName)};`);
                    }
                };
                // Collect all of the exports
                path.traverse({
                    ExportNamedDeclaration(exportPath) {
                        if (exportPath.node.declaration) {
                            if (exportPath.node.declaration.type === 'VariableDeclaration') {
                                exportPath.node.declaration.declarations.forEach((declaration) => {
                                    if (declaration.id.type === 'Identifier') {
                                        const exportName = declaration.id.name;
                                        pushProxy(exportName);
                                    }
                                });
                            }
                            else if (exportPath.node.declaration.type === 'FunctionDeclaration') {
                                const exportName = exportPath.node.declaration.id?.name;
                                if (exportName) {
                                    pushProxy(exportName);
                                }
                            }
                            else if (exportPath.node.declaration.type === 'ClassDeclaration') {
                                const exportName = exportPath.node.declaration.id?.name;
                                if (exportName) {
                                    pushProxy(exportName);
                                }
                            }
                            else if (!['InterfaceDeclaration', 'TypeAlias'].includes(exportPath.node.declaration.type)) {
                                // TODO: What is this type?
                                console.warn('[babel-preset-expo] Unsupported export specifier for "use client":', exportPath.node.declaration.type);
                            }
                        }
                        else {
                            exportPath.node.specifiers.forEach((specifier) => {
                                if (core_1.types.isIdentifier(specifier.exported)) {
                                    const exportName = specifier.exported.name;
                                    pushProxy(exportName);
                                }
                                else {
                                    // TODO: What is this type?
                                    console.warn('[babel-preset-expo] Unsupported export specifier for "use client":', specifier);
                                }
                            });
                        }
                    },
                    ExportDefaultDeclaration() {
                        pushProxy('default');
                    },
                });
                // Clear the body
                path.node.body = [];
                path.node.directives = [];
                path.pushContainer('body', core_1.template.ast(proxyModule.join('\n')));
                assertExpoMetadata(state.file.metadata);
                // Save the client reference in the metadata.
                if (!state.file.metadata.clientReferences) {
                    state.file.metadata.clientReferences ??= [];
                }
                state.file.metadata.clientReferences.push(outputKey);
                // Store the proxy export names for testing purposes.
                state.file.metadata.proxyExports = [...proxyExports];
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
