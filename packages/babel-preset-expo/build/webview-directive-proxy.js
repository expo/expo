"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoWebviewDirectiveProxy = void 0;
/**
 * Copyright © 2024 650 Industries.
 */
const core_1 = require("@babel/core");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = require("path");
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
function expoWebviewDirectiveProxy(api) {
    // TODO: Is exporting
    const isProduction = api.caller(common_1.getIsProd);
    const platform = api.caller((caller) => caller?.platform);
    return {
        name: 'expo-webview-directive-proxy',
        visitor: {
            Program(path, state) {
                // Native only feature.
                if (platform === 'web') {
                    return;
                }
                const isUseWebview = path.node.directives.some((directive) => directive.value.value === 'use dom');
                const isUseWebviewSource = false;
                // const isUseWebviewSource = path.node.directives.some(
                //   (directive: any) => directive.value.value === 'use dom:source'
                // );
                const filePath = state.file.opts.filename;
                if (!filePath) {
                    // This can happen in tests or systems that use Babel standalone.
                    throw new Error('[Babel] Expected a filename to be set in the state');
                }
                // File starts with "use client" directive.
                if (!isUseWebview && !isUseWebviewSource) {
                    // Do nothing for code that isn't marked as a client component.
                    return;
                }
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                let proxyModule = [];
                if (isProduction) {
                    // MUST MATCH THE EXPORT COMMAND!
                    const hash = crypto_1.default.createHash('sha1').update(outputKey).digest('hex');
                    if (platform === 'ios') {
                        const outputName = `www.bundle/${hash}.html`;
                        proxyModule = [`const proxy = { uri: ${JSON.stringify(outputName)} };`];
                    }
                    else if (platform === 'android') {
                        const outputName = `www/${hash}.html`;
                        proxyModule = [
                            `const proxy = { uri: "file:///android_asset" + ${JSON.stringify(outputName)} };`,
                        ];
                    }
                    else {
                        throw new Error('production "use dom" directive is not supported yet for platform: ' + platform);
                    }
                }
                else {
                    proxyModule = [
                        // Add the basename to improve the Safari debug preview option.
                        `const proxy = { uri: new URL("/_expo/@dom/${(0, path_1.basename)(filePath)}?file=" + ${JSON.stringify(outputKey)}, window.location.href).toString() };`,
                    ];
                }
                proxyModule.push(!isUseWebviewSource
                    ? `
                import React from 'react';
              import { WebView } from 'expo/dom/internal';
              export default React.forwardRef((props, ref) => {
                return React.createElement(WebView, { ref, ...props, $$source: proxy });
            });
              `
                    : `export default proxy`);
                // Clear the body
                path.node.body = [];
                path.node.directives = [];
                path.pushContainer('body', core_1.template.ast(proxyModule.join('\n')));
                assertExpoMetadata(state.file.metadata);
                // Save the client reference in the metadata.
                state.file.metadata.webviewReference = outputKey;
            },
        },
    };
}
exports.expoWebviewDirectiveProxy = expoWebviewDirectiveProxy;
function assertExpoMetadata(metadata) {
    if (metadata && typeof metadata === 'object') {
        return;
    }
    throw new Error('Expected Babel state.file.metadata to be an object');
}
