import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/expo/expo/blob/main/packages/eslint-plugin-expo/docs/rules/${name}.md`
);

export const noEnvVarDestructuring = createRule({
  name: 'no-env-var-destructuring',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow desctructuring of environment variables',
    },
    schema: [],
    messages: {
      unexpectedDestructuring:
        'Unexpected desctucturing. Cannot descructure {{value}} from process.env',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        const left = node.id;
        const isDestructuring = left.type === 'ObjectPattern';
        const isProcessEnv =
          node.init?.type === 'MemberExpression' &&
          node.init.object.type === 'Identifier' &&
          node.init.object.name === 'process' &&
          node.init.property.type === 'Identifier' &&
          node.init.property.name === 'env';

        if (isDestructuring && isProcessEnv) {
          left.properties.forEach(function (property) {
            context.report({
              node,
              messageId: 'unexpectedDestructuring',
              data: {
                value: property.value?.type === 'Identifier' ? property.value.name : 'variables',
              },
            });
          });
        }
      },
    };
  },
});
