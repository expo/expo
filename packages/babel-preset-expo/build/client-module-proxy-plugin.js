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
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                // File starts with "use client" directive.
                if (!isUseClient && !isUseServer) {
                    // Do nothing for code that isn't marked as a client component.
                    return;
                }
                // Clear the body
                if (isUseClient) {
                    path.node.body = [];
                    path.node.directives = [];
                    path.pushContainer('body', core_1.template.ast `module.exports = require("react-server-dom-webpack/server").createClientModuleProxy(${JSON.stringify(outputKey)});`);
                }
                else {
                    path.pushContainer('body', core_1.template.ast `
            ;(() => {
              if (typeof module.exports === 'function') {
                require('react-server-dom-webpack/server').registerServerReference(module.exports, ${JSON.stringify(outputKey)}, null);
              } else {
                for (const key in module.exports) {
                  if (typeof module.exports[key] === 'function') {
                    require('react-server-dom-webpack/server').registerServerReference(module.exports[key], ${JSON.stringify(outputKey)}, key);
                  }
                }
              }
            })()`);
                }
            },
        },
    };
}
exports.reactClientReferencesPlugin = reactClientReferencesPlugin;
