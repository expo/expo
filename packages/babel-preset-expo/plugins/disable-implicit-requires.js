/**
 * A plugin for native platforms to disable implicit requires.
 */
module.exports = () => ({
  visitor: {
    AssignmentExpression(path) {
      if (path.node.operator !== '=') {
        return;
      }

      const { left } = path.node;

      if (left.type !== 'MemberExpression') {
        return;
      }

      const { object } = left;

      if (
        (object.type === 'TypeCastExpression' && object.expression.name === 'require') ||
        (object.type === 'Identifier' && object.name === 'require')
      ) {
        path.remove();
      }
    },
  },
});
