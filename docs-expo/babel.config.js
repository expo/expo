// `../docs/next.config.ts` sets the Next.js compiler options `reactRemoveProperties` and
// `removeConsole`. These plugins do the same work in the production build.
function removeTestProperties() {
  return {
    name: 'remove-test-properties',
    visitor: {
      JSXAttribute(path) {
        const { name } = path.node.name;
        if (typeof name === 'string' && name.startsWith('data-test')) {
          path.remove();
        }
      },
    },
  };
}

function removeConsoleCalls({ types: t }) {
  return {
    name: 'remove-console-calls',
    visitor: {
      CallExpression(path) {
        const callee = path.get('callee');
        if (
          callee.isMemberExpression() &&
          callee.get('object').isIdentifier({ name: 'console' }) &&
          !path.scope.getBinding('console') &&
          !callee.get('property').isIdentifier({ name: 'error' })
        ) {
          path.replaceWith(t.unaryExpression('void', t.numericLiteral(0)));
        }
      },
    },
  };
}

module.exports = function (api) {
  const isProduction = api.env('production');
  api.cache.using(() => isProduction);

  return {
    presets: ['babel-preset-expo'],
    overrides: isProduction
      ? [{ exclude: /node_modules/, plugins: [removeTestProperties, removeConsoleCalls] }]
      : [],
  };
};
