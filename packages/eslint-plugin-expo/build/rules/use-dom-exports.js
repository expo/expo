"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDomExports = void 0;
const utils_1 = require("@typescript-eslint/utils");
const createRule = utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/expo/expo/blob/main/packages/eslint-plugin-expo/docs/rules/${name}.md`);
exports.useDomExports = createRule({
    name: 'use-dom-exports',
    meta: {
        type: 'problem',
        docs: {
            description: 'Files with the "use dom" directive may only contain a single default export of a React component, which must not be async and must be a function.',
        },
        schema: [],
        messages: {
            noOtherExports: 'Files with the "use dom" directive may not contain named exports or other default exports.',
            asyncDefaultExport: 'The default export must not be an async function.',
            invalidDefaultExport: 'The default export must be a function.',
            missingDefaultExport: 'Files with the "use dom" directive must export a React component as the default export.',
        },
    },
    defaultOptions: [],
    create(context) {
        return {
            Program(node) {
                let isDomComponent = false;
                let hasDefaultExport = false;
                for (const block of node.body) {
                    // Check for "use dom" directive
                    if (block.type === 'ExpressionStatement' &&
                        block.expression.type === 'Literal' &&
                        block.expression.value === 'use dom') {
                        isDomComponent = true;
                    }
                    if (!isDomComponent) {
                        continue;
                    }
                    // Disallow named exports
                    if (block.type === 'ExportNamedDeclaration' &&
                        (!block.declaration ||
                            (block.declaration.type !== 'TSInterfaceDeclaration' &&
                                block.declaration.type !== 'TSTypeAliasDeclaration' &&
                                block.declaration.type !== 'TSModuleDeclaration'))) {
                        if (block.specifiers.some((specifier) => specifier.type === 'ExportSpecifier' &&
                            specifier.exported.type === 'Identifier' &&
                            specifier.exported.name === 'default')) {
                            // export { default } from
                            if (hasDefaultExport) {
                                context.report({
                                    node: block,
                                    messageId: 'noOtherExports',
                                });
                                continue;
                            }
                            hasDefaultExport = true;
                            if (block.specifiers.length > 1) {
                                // export { default, other } from
                                context.report({
                                    node: block,
                                    messageId: 'noOtherExports',
                                });
                            }
                        }
                        else {
                            context.report({
                                node: block,
                                messageId: 'noOtherExports',
                            });
                        }
                    }
                    // Handle default exports
                    if (block.type === 'ExportDefaultDeclaration') {
                        if (hasDefaultExport) {
                            context.report({
                                node: block,
                                messageId: 'noOtherExports',
                            });
                            continue;
                        }
                        hasDefaultExport = true;
                        // Ensure the default export is a function
                        if (block.declaration.type === 'Identifier') {
                            continue;
                        }
                        if (block.declaration.type !== 'FunctionDeclaration' &&
                            block.declaration.type !== 'ArrowFunctionExpression' &&
                            block.declaration.type !== 'FunctionExpression') {
                            context.report({
                                node: block,
                                messageId: 'invalidDefaultExport',
                            });
                            continue;
                        }
                        // Ensure the default export is not async
                        if (block.declaration.async) {
                            context.report({
                                node: block,
                                messageId: 'asyncDefaultExport',
                            });
                        }
                    }
                    if (block.type === 'ExportAllDeclaration' &&
                        block.exported &&
                        block.exported.name === 'default') {
                        if (hasDefaultExport) {
                            context.report({
                                node: block,
                                messageId: 'noOtherExports',
                            });
                            continue;
                        }
                        hasDefaultExport = true;
                    }
                }
                // Ensure a default export exists if "use dom" is present
                if (isDomComponent && !hasDefaultExport) {
                    context.report({
                        node,
                        messageId: 'missingDefaultExport',
                    });
                }
            },
        };
    },
});
