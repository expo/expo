"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syntaxPlugins = void 0;
/** Syntax/parser plugins applied at top-level */
exports.syntaxPlugins = [
    [require('babel-plugin-syntax-hermes-parser'), { parseLangTypes: 'flow' }],
    [require('@babel/plugin-syntax-export-default-from')],
    [require('@babel/plugin-syntax-dynamic-import')],
    [require('@babel/plugin-syntax-nullish-coalescing-operator')],
    [require('@babel/plugin-syntax-optional-chaining')],
];
//# sourceMappingURL=syntax.js.map