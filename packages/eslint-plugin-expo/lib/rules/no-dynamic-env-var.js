/**
 * @fileoverview Prevents process.env from being accessed dynamically
 * @author Expo
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevents process.env from being accessed dynamically',
      recommended: true,
      url: 'https://github.com/expo/expo/tree/main/packages/eslint-plugin-expo/docs/rules/no-dynamic-env-var.md',
    },
    fixable: null,
    schema: [],
    messages: {
      unexpectedDynamicAccess:
        'Unexpected dynamic access. Cannot dynamically access {{value}} from process.env',
    },
  },

  create(context) {
    const isMemberExpressionProcessEnv = (obj) => {
      return (
        obj &&
        obj.object &&
        obj.object.name === 'process' &&
        obj.property &&
        obj.property.name === 'env'
      );
    };

    return {
      VariableDeclarator(node) {
        const right = node.init;
        const isProcessEnv = isMemberExpressionProcessEnv(right.object);

        if (isProcessEnv && right.computed) {
          context.report({
            node,
            messageId: 'unexpectedDynamicAccess',
            data: {
              value: right.property.value || right.property.name,
            },
          });
        }
      },
    };
  },
};
