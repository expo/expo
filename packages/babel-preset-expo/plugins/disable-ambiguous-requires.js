/**
 * Disable ambiguous module ID requires from React Native:
 * https://github.com/facebook/react-native/commit/06b5bda34923b68ba5141e78c36ccbdc5f4bcff1
 *
 * Without this operation, the following error will be thrown when bundling with Webpack:
 * `Critical dependency: require function is used in a way in which dependencies cannot be statically extracted`
 *
 * - react-native/Libraries/Performance/Systrace.js 124:2-9
 * - react-native/Libraries/Core/setUpReactRefresh.js 30:2-9
 */
module.exports = () => ({
  visitor: {
    AssignmentExpression(path) {
      if (isValidRequire(path) && (isCastedRequire(path) || isChainedRequire(path))) {
        path.remove();
      }
    },
  },
});

/**
 * Is a require statement being assigned to something.
 * Prevents further checks when `path.node.left` is undefined.
 *
 * @param {*} path
 */
function isValidRequire(path) {
  return path.node.operator === '=' && path.node.left.type === 'MemberExpression';
}

/**
 * Is a require statement formatted like: `(require: any)`
 *
 * Example from `react-native/Libraries/Core/setUpReactRefresh.js 30:2-9`:
 * `(require: any).Refresh = Refresh;`
 *
 * @param {*} path
 */
function isCastedRequire(path) {
  const { object } = path.node.left;
  return object.type === 'TypeCastExpression' && object.expression.name === 'require';
}

/**
 * Is a require statement formatted like: `require.`
 *
 * @param {*} path
 */
function isChainedRequire(path) {
  const { object } = path.node.left;
  return object.type === 'Identifier' && object.name === 'require';
}
