module.exports = function (
  api,
  // e.g. `[{ name: 'EXPO_OS', value: 'ios' }]`
  options
) {
  const { types: t } = api;

  const { variables } = options;
  if (!Array.isArray(variables)) {
    throw new Error('Expected `variables` to be an array.');
  }
  for (const variable of variables) {
    if (typeof variable.name !== 'string') {
      throw new Error('Expected `variables[].name` to be a string.');
    }
    if (typeof variable.value !== 'string') {
      throw new Error(`Expected \`variables[].value\` to be a string (name: ${variable.name}).`);
    }
  }
  return {
    name: 'inline-environment-variables',
    visitor: {
      MemberExpression(path) {
        if (
          !t.isIdentifier(path.node.object, { name: 'process' }) ||
          !t.isIdentifier(path.node.property, { name: 'env' })
        ) {
          return;
        }

        const parent = path.parentPath;
        if (!t.isMemberExpression(parent.node)) {
          return;
        }

        for (const { name, value } of variables) {
          if (t.isIdentifier(parent.node.property, { name })) {
            parent.replaceWith(t.stringLiteral(value));
            return;
          }
        }
      },
    },
  };
};
