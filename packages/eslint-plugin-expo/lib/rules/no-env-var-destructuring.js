/**
 * @fileoverview Disallow destructuring env vars from process.env
 * @author Expo
 */
'use strict';

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
      unexpectedDesctucturing:
        'Unexpected desctucturing. Cannot descructure {{destructuredVariable}} from process.env',
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
        const left = node.id;
        const right = node.init;
        const isDestructuring = left.type === 'ObjectPattern';
        const isProcessEnv = isMemberExpressionProcessEnv(right);
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
