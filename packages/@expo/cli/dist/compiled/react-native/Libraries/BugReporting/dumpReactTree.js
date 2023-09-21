'use strict';
function dumpReactTree() {
  try {
    return getReactTree();
  } catch (e) {
    return 'Failed to dump react tree: ' + e;
  }
}
function getReactTree() {
  return 'React tree dumps have been temporarily disabled while React is ' + 'upgraded to Fiber.';
}
module.exports = dumpReactTree;