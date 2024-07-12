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
const url_1 = __importDefault(require("url"));
const crypto_1 = __importDefault(require("crypto"));
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
                const isUseWebview = path.node.directives.some((directive) => directive.value.value === 'use webview');
                const isUseWebviewSource = path.node.directives.some((directive) => directive.value.value === 'use webview:source');
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
                        const outputName = `www.bundle/${hash}/index.html`;
                        proxyModule = [`const proxy = { uri: ${JSON.stringify(outputName)} };`];
                    }
                    else if (platform === 'android') {
                        const outputName = `www/${hash}/index.html`;
                        proxyModule = [
                            `const proxy = { uri: "file:///android_asset" + ${JSON.stringify(outputName)} };`,
                        ];
                    }
                    else {
                        throw new Error('production webview directive is not supported yet for platform: ' + platform);
                    }
                }
                else {
                    proxyModule = [
                        `const proxy = { uri: new URL("/_expo/@iframe?file=" + ${JSON.stringify(outputKey)}, window.location.href).toString() };`,
                    ];
                }
                proxyModule.push(!isUseWebviewSource
                    ? `
                import React from 'react';
              import { WebView } from 'react-native-webview';
              export default function WebviewProxy(props) {
                return React.createElement(WebView, { originWhitelist: ['*'], webviewDebuggingEnabled: ${isProduction ? 'false' : 'true'}, ...props, source: proxy });
              }
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
