function countBooleanClauses(expression) {
  if (expression.type === 'LogicalExpression') {
    return countBooleanClauses(expression.left) + countBooleanClauses(expression.right);
  }
  if (expression.type === 'UnaryExpression' && expression.operator === '!') {
    return countBooleanClauses(expression.argument);
  }
  if (
    expression.type === 'TSAsExpression' ||
    expression.type === 'TSSatisfiesExpression' ||
    expression.type === 'TSNonNullExpression'
  ) {
    return countBooleanClauses(expression.expression);
  }
  return 1;
}

export default {
  meta: { name: 'expo' },
  rules: {
    'ternary-limits': {
      meta: { type: 'suggestion' },
      create(context) {
        return {
          ConditionalExpression(node) {
            if (node.loc.end.line - node.loc.start.line >= 3) {
              context.report({ node, message: 'Keep ternaries within three source lines.' });
            }
            if (countBooleanClauses(node.test) > 3) {
              context.report({
                node: node.test,
                message: 'Keep ternary tests within three boolean clauses.',
              });
            }
          },
        };
      },
    },
  },
};
