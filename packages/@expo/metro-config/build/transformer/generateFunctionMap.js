"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateFunctionMap = generateFunctionMap;
function _env() {
  const data = require("../env");
  _env = function () {
    return data;
  };
  return data;
}
function generateFunctionMap(...props) {
  //  `x_facebook_sources` is a source map feature that we disable by default since it isn't documented
  // and doesn't appear to add much value to the DX, it also increases bundle time, and source map size.
  // The feature supposedly provides improved function names for anonymous functions, but we will opt towards
  // linting to prevent users from adding anonymous functions for important features like React components.
  //
  // Here is an example stack trace for a component that throws an error
  // in the root component (which is an anonymous function):
  //
  // Before:
  // - <anonymous> App.js:5:9
  // - renderApplication renderApplication.js:54:5
  // - runnables.appKey.run AppRegistry.js:117:26
  //
  // After:
  // - _default App.js:5:9
  // - renderApplication renderApplication.js:54:5
  // - run AppRegistry.js:117:26
  //
  if (_env().env.EXPO_USE_FB_SOURCES) {
    return require('metro-source-map').generateFunctionMap(...props);
  }
  return null;
}
//# sourceMappingURL=generateFunctionMap.js.map