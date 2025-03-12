"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the upstream transformer, but with modifications made for web production hashing.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/utils/assetTransformer.js#L1
 */
const template_1 = __importDefault(require("@babel/template"));
const t = __importStar(require("@babel/types"));
const util_1 = require("metro/src/Bundler/util");
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = __importDefault(require("node:url"));
const getAssets_1 = require("./getAssets");
// Register client components for assets in server component environments.
const buildClientReferenceRequire = template_1.default.statement(`module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(FILE_PATH);`);
const buildStringRef = template_1.default.statement(`module.exports = FILE_PATH;`);
const buildStaticObjectRef = template_1.default.statement(
// Matches the `ImageSource` type from React Native: https://reactnative.dev/docs/image#source
`module.exports = { uri: FILE_PATH, width: WIDTH, height: HEIGHT };`);
async function transform({ filename, options, }, assetRegistryPath, assetDataPlugins) {
    options ??= options || {
        platform: '',
        projectRoot: '',
    };
    // Is bundling for webview.
    const isDomComponent = options.platform === 'web' && options.customTransformOptions?.dom;
    const useMd5Filename = options.customTransformOptions?.useMd5Filename;
    const isExport = options.publicPath.includes('?export_path=');
    const isReactServer = options.customTransformOptions?.environment === 'react-server';
    const isServerEnv = isReactServer || options.customTransformOptions?.environment === 'node';
    const absolutePath = node_path_1.default.resolve(options.projectRoot, filename);
    const getClientReference = () => isReactServer ? node_url_1.default.pathToFileURL(absolutePath).href : undefined;
    if ((options.platform !== 'web' ||
        // React Server DOM components should use the client reference in order to local embedded assets.
        isDomComponent) &&
        // NOTE(EvanBacon): There may be value in simply evaluating assets on the server.
        // Here, we're passing the info back to the client so the multi-resolution asset can be evaluated and downloaded.
        isReactServer) {
        const clientReference = getClientReference();
        return {
            ast: {
                ...t.file(t.program([
                    buildClientReferenceRequire({
                        FILE_PATH: JSON.stringify(clientReference),
                    }),
                ])),
                errors: [],
            },
            reactClientReference: clientReference,
        };
    }
    const data = await (0, getAssets_1.getUniversalAssetData)(absolutePath, filename, assetDataPlugins, options.platform, isDomComponent && isExport
        ? // If exporting a dom component, we need to use a public path that doesn't start with `/` to ensure that assets are loaded
            // relative to the `DOM_COMPONENTS_BUNDLE_DIR`.
            `/assets?export_path=assets`
        : options.publicPath);
    if (isServerEnv || options.platform === 'web') {
        const type = !data.type ? '' : `.${data.type}`;
        let assetPath;
        if (useMd5Filename) {
            assetPath = data.hash + type;
        }
        else if (!isExport) {
            assetPath = data.httpServerLocation + '/' + data.name + type;
        }
        else {
            assetPath = data.httpServerLocation.replace(/\.\.\//g, '_') + '/' + data.name + type;
        }
        // If size data is known then it should be passed back to ensure the correct dimensions are used.
        if (data.width != null || data.height != null) {
            return {
                ast: {
                    ...t.file(t.program([
                        buildStaticObjectRef({
                            FILE_PATH: JSON.stringify(assetPath),
                            WIDTH: data.width != null ? t.numericLiteral(data.width) : t.buildUndefinedNode(),
                            HEIGHT: data.height != null ? t.numericLiteral(data.height) : t.buildUndefinedNode(),
                        }),
                    ])),
                    errors: [],
                },
                reactClientReference: getClientReference(),
            };
        }
        // Use single string references outside of client-side React Native.
        // module.exports = "/foo/bar.png";
        return {
            ast: {
                ...t.file(t.program([buildStringRef({ FILE_PATH: JSON.stringify(assetPath) })])),
                errors: [],
            },
            reactClientReference: getClientReference(),
        };
    }
    return {
        ast: {
            ...(0, util_1.generateAssetCodeFileAst)(assetRegistryPath, data),
            errors: [],
        },
    };
}
exports.transform = transform;
//# sourceMappingURL=asset-transformer.js.map