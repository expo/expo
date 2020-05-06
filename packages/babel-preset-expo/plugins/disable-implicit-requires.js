/**
 * A plugin for native platforms to disable implicit requires.
 */
module.exports = () => ({
  visitor: {
    AssignmentExpression(path) {
      if (!isValidRequire(path) && (isCastedRequire(path) || isChainedRequire(path))) {
        path.remove();
      }
    },
  },
});

function isValidRequire(path) {
  return path.node.operator !== '=' || path.node.left.type !== 'MemberExpression';
}

function isCastedRequire(path) {
  const { object } = path.node.left;
  return object.type === 'TypeCastExpression' && object.expression.name === 'require';
}

function isChainedRequire(path) {
  const { object } = path.node.left;
  return object.type === 'Identifier' && object.name === 'require';
}
