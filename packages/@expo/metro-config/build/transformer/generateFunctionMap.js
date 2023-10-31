"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateFunctionMap = generateFunctionMap;
function generateFunctionMap(...props) {
  // Unlike default sourcemaps, `metro-source-map` adds the `x_facebook_sources` field to the sourcemap.
  // The feature provides improved function names for anonymous functions.
  //
  // Here is an example stack trace for a component that throws an error
  // in the root component (which is an anonymous function):
  //
  // Without `x_facebook_sources`:
  // - <anonymous> App.js:5:9
  // - renderApplication renderApplication.js:54:5
  // - runnables.appKey.run AppRegistry.js:117:26
  //
  // With `x_facebook_sources`:
  // - _default App.js:5:9
  // - renderApplication renderApplication.js:54:5
  // - run AppRegistry.js:117:26
  //

  return require('metro-source-map').generateFunctionMap(...props);
}
//# sourceMappingURL=generateFunctionMap.js.map