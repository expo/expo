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
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSync = void 0;
/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const babel = __importStar(require("./babel-core"));
// TS detection conditions copied from @react-native/babel-preset
function isTypeScriptSource(fileName) {
    return fileName?.endsWith('.ts');
}
function isTSXSource(fileName) {
    return fileName?.endsWith('.tsx');
}
function transformSync(src, babelConfig, { hermesParser }) {
    const useBabelCore = isTypeScriptSource(babelConfig.filename) ||
        isTSXSource(babelConfig.filename) ||
        !hermesParser;
    const parser = useBabelCore ? parseWithBabel : parseWithHermes;
    return parser(src, babelConfig);
}
exports.transformSync = transformSync;
function parseWithHermes(src, babelConfig) {
    const sourceAst = require('hermes-parser').parse(src, {
        babel: true,
        sourceType: babelConfig.sourceType,
    });
    return babel.transformFromAstSync(sourceAst, src, babelConfig);
}
function parseWithBabel(src, babelConfig) {
    return babel.transformSync(src, babelConfig);
}
//# sourceMappingURL=transformSync.js.map