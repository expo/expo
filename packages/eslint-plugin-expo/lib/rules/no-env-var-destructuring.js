/**
 * @fileoverview Disallow destructuring env vars from process.env
 * @author Expo
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    severity: 'error',
    type: 'problem',
    docs: {
      description: 'Disallow desctructuring of environment variables',
    },
    schema: [],
    messages: {
      unexpectedDesctucturing: 'Unexpected desctucturing. Cannot descructure {{destructuredVariable}} from process.env',
    },
  },

  create(context) {
    return {
      VariableDeclarator(node) {
        const left = node.id;
        const right = node.init;
        const isDestructuring = left.type === 'ObjectPattern';
        const isProcessEnv = right.property.name === 'env' && right.object.name === 'process';
        if (isDestructuring && isProcessEnv) {
          left.properties.forEach(function (property) {
            context.report({
              node,
              messageId: 'unexpectedDesctucturing',
              data: {
                destructuredVariable: property.value.name,
              },
            });
          });
        }
      },
    };
  },
};
