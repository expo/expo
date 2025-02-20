"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoUseDomDirectivePlugin = void 0;
/**
 * Copyright © 2024 650 Industries.
 */
const core_1 = require("@babel/core");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = require("path");
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
function expoUseDomDirectivePlugin(api) {
    const { types: t } = api;
    // TODO: Is exporting
    const isProduction = api.caller(common_1.getIsProd);
    const platform = api.caller((caller) => caller?.platform);
    const projectRoot = api.caller(common_1.getPossibleProjectRoot);
    return {
        name: 'expo-use-dom-directive',
        visitor: {
            Program(path, state) {
                // Native only feature.
                if (platform === 'web') {
                    return;
                }
                const hasUseDomDirective = path.node.directives.some((directive) => directive.value.value === 'use dom');
                const filePath = state.file.opts.filename;
                if (!filePath) {
                    // This can happen in tests or systems that use Babel standalone.
                    throw new Error('[Babel] Expected a filename to be set in the state');
                }
                // File starts with "use dom" directive.
                if (!hasUseDomDirective) {
                    // Do nothing for code that isn't marked as a dom component.
                    return;
                }
                // Assert that a default export must exist and that no other exports should be present.
                // NOTE: In the future we could support other exports with extraction.
                let hasDefaultExport = false;
                // Collect all of the exports
                path.traverse({
                    ExportNamedDeclaration(path) {
                        const declaration = path.node.declaration;
                        if (t.isTypeAlias(declaration) ||
                            t.isInterfaceDeclaration(declaration) ||
                            t.isTSTypeAliasDeclaration(declaration) ||
                            t.isTSInterfaceDeclaration(declaration)) {
                            // Allows type exports
                            return;
                        }
                        throw path.buildCodeFrameError('Modules with the "use dom" directive only support a single default export.');
                    },
                    ExportDefaultDeclaration() {
                        hasDefaultExport = true;
                    },
                });
                if (!hasDefaultExport) {
                    throw path.buildCodeFrameError('The "use dom" directive requires a default export to be present in the file.');
                }
                // Assert that _layout routes cannot be used in DOM components.
                const fileBasename = (0, path_1.basename)(filePath);
                if (projectRoot &&
                    // Detecting if the file is in the router root would be extensive as it would cause a more complex
                    // cache key for each file. Instead, let's just check if the file is in the project root and is not a node_module,
                    // then we can assert that users should not use `_layout` or `+api` with "use dom".
                    filePath.includes(projectRoot) &&
                    !filePath.match(/node_modules/)) {
                    if (fileBasename.match(/^_layout\.[jt]sx?$/)) {
                        throw path.buildCodeFrameError('Layout routes cannot be marked as DOM components because they cannot render native views.');
                    }
                    else if (
                    // No API routes
                    fileBasename.match(/\+api\.[jt]sx?$/)) {
                        throw path.buildCodeFrameError('API routes cannot be marked as DOM components.');
                    }
                }
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                const proxyModule = [
                    `import React from 'react';`,
                    `import { WebView } from 'expo/dom/internal';`,
                ];
                if (isProduction) {
                    // MUST MATCH THE EXPORT COMMAND!
                    const hash = crypto_1.default.createHash('md5').update(outputKey).digest('hex');
                    proxyModule.push(`const filePath = "${hash}.html";`);
                }
                else {
                    proxyModule.push(
                    // Add the basename to improve the Safari debug preview option.
                    `const filePath = "${fileBasename}?file=" + ${JSON.stringify(outputKey)};`);
                }
                proxyModule.push(`
export default React.forwardRef((props, ref) => {
  return React.createElement(WebView, { ref, ...props, filePath });
});`);
                // Removes all imports using babel API, that will disconnect import bindings from the program.
                // plugin-transform-typescript TSX uses the bindings to remove type imports.
                // If the DOM component has `import React from 'react';`,
                // the plugin-transform-typescript treats it as an typed import and removes it.
                // That will futher cause undefined `React` error.
                path.traverse({
                    ImportDeclaration(path) {
                        path.remove();
                    },
                });
                // Clear the body
                path.node.body = [];
                path.node.directives = [];
                path.pushContainer('body', core_1.template.ast(proxyModule.join('\n')));
                assertExpoMetadata(state.file.metadata);
                // Save the client reference in the metadata.
                state.file.metadata.expoDomComponentReference = outputKey;
            },
        },
    };
}
exports.expoUseDomDirectivePlugin = expoUseDomDirectivePlugin;
function assertExpoMetadata(metadata) {
    if (metadata && typeof metadata === 'object') {
        return;
    }
    throw new Error('Expected Babel state.file.metadata to be an object');
}
