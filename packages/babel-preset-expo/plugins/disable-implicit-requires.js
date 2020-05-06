/**
 * A plugin for native platforms to disable implicit requires.
 */
module.exports = () => ({
  visitor: {
    AssignmentExpression(path) {
      if (path.node.operator !== '=' || path.node.left.type !== 'MemberExpression') {
        return;
      }

      const { object } = path.node.left;

      if (
        (object.type === 'TypeCastExpression' && object.expression.name === 'require') ||
        (object.type === 'Identifier' && object.name === 'require')
      ) {
        path.remove();
      }
    },
  },
});
