"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noDynamicEnvVar = void 0;
const utils_1 = require("@typescript-eslint/utils");
const createRule = utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/expo/expo/blob/main/packages/eslint-plugin-expo/docs/rules/${name}.md`);
exports.noDynamicEnvVar = createRule({
    name: 'no-dynamic-env-var',
    meta: {
        type: 'problem',
        docs: {
            description: 'Prevents process.env from being accessed dynamically',
        },
        schema: [],
        messages: {
            unexpectedDynamicAccess: 'Unexpected dynamic access. Cannot dynamically access {{value}} from process.env',
        },
    },
    defaultOptions: [],
    create(context) {
        return {
            VariableDeclarator(node) {
                const isProcessEnv = node.init?.type === 'MemberExpression' &&
                    node.init.object.type === 'MemberExpression' &&
                    node.init.object.object.type === 'Identifier' &&
                    node.init.object.object.name === 'process' &&
                    node.init.object.property.type === 'Identifier' &&
                    node.init.object.property.name === 'env';
                if (isProcessEnv && node.init?.type === 'MemberExpression' && node.init.computed) {
                    const identifierName = node.init.property.type === 'Identifier' ? node.init.property.name : '';
                    const literalValue = node.init.property.type === 'Literal' ? node.init.property?.value : '';
                    context.report({
                        node,
                        messageId: 'unexpectedDynamicAccess',
                        data: {
                            value: identifierName || literalValue,
                        },
                    });
                }
            },
        };
    },
});
