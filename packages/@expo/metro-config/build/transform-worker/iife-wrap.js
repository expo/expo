"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
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
exports.wrapModule = void 0;
const t = __importStar(require("@babel/types"));
/** A fork of the upstream method but with the `require` rename removed since the modules already run scoped in iife. */
function wrapModule(fileAst, importDefaultName, importAllName, dependencyMapName, globalPrefix) {
    // TODO: Use a cheaper transform that doesn't require AST.
    const params = buildParameters(importDefaultName, importAllName, dependencyMapName);
    const factory = functionFromProgram(fileAst.program, params);
    const def = t.callExpression(t.identifier(`${globalPrefix}__d`), [factory]);
    return t.file(t.program([t.expressionStatement(def)]));
}
exports.wrapModule = wrapModule;
function functionFromProgram(program, parameters) {
    return t.functionExpression(undefined, parameters.map(t.identifier), t.blockStatement(program.body, program.directives));
}
function buildParameters(importDefaultName, importAllName, dependencyMapName) {
    return [
        'global',
        'require',
        importDefaultName,
        importAllName,
        'module',
        'exports',
        dependencyMapName,
    ];
}
//# sourceMappingURL=iife-wrap.js.map