"use strict";
/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Babel plugin that transforms widget component JSX expressions.
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgetsPlugin = widgetsPlugin;
const generator = __importStar(require("@babel/generator"));
function widgetsPlugin(api) {
    const { types: t } = api;
    return {
        name: 'expo-widgets',
        visitor: {
            ['FunctionDeclaration|FunctionExpression']: {
                exit(path) {
                    if (!isWidgetFunction(path)) {
                        return;
                    }
                    removeWidgetDirective(path.node.body);
                    const code = generateWidgetFunctionString(t, path.node);
                    const literal = buildTemplateLiteral(t, code);
                    if (path.parentPath.isExportDefaultDeclaration()) {
                        path.parentPath.replaceWith(t.exportDefaultDeclaration(literal));
                        return;
                    }
                    if (path.node.id) {
                        path.replaceWith(t.variableDeclaration('var', [t.variableDeclarator(path.node.id, literal)]));
                    }
                    else {
                        path.replaceWith(literal);
                    }
                },
            },
            ArrowFunctionExpression: {
                exit(path) {
                    if (!isWidgetFunction(path)) {
                        return;
                    }
                    // Check above will guarantee body is a BlockStatement
                    removeWidgetDirective(path.node.body);
                    const code = generateWidgetFunctionString(t, path.node);
                    const literal = buildTemplateLiteral(t, code);
                    path.replaceWith(literal);
                },
            },
            ObjectMethod: {
                exit(path) {
                    if (!isWidgetFunction(path)) {
                        return;
                    }
                    removeWidgetDirective(path.node.body);
                    const code = generateWidgetFunctionString(t, path.node);
                    const literal = buildTemplateLiteral(t, code);
                    path.replaceWith(t.objectProperty(path.node.key, literal, path.node.computed));
                },
            },
        },
    };
    function isWidgetFunction(path) {
        if (!t.isBlockStatement(path.node.body)) {
            return false;
        }
        return path.node.body.directives.some((directive) => t.isDirectiveLiteral(directive.value) && directive.value.value === 'widget');
    }
    function removeWidgetDirective(body) {
        const widgetDirectiveIndex = body.directives.findIndex((directive) => t.isDirectiveLiteral(directive.value) && directive.value.value === 'widget');
        if (widgetDirectiveIndex !== -1) {
            body.directives.splice(widgetDirectiveIndex, 1);
        }
    }
}
function generateWidgetFunctionString(t, node) {
    const expression = t.functionExpression(null, node.params, node.body, node.generator, node.async);
    return generator.generate(expression, { compact: true }).code;
}
function buildTemplateLiteral(t, code) {
    const raw = escapeTemplateLiteral(code);
    return t.templateLiteral([t.templateElement({ raw, cooked: raw }, true)], []);
}
function escapeTemplateLiteral(value) {
    return value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
