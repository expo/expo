var invariant = require('invariant');
var React = require('react');
var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
var renderers = findRenderers();
function findRenderers() {
  var allRenderers = Array.from(hook.renderers.values());
  invariant(allRenderers.length >= 1, 'Expected to find at least one React Native renderer on DevTools hook.');
  return allRenderers;
}
module.exports = function getInspectorDataForViewAtPoint(inspectedView, locationX, locationY, callback) {
  var shouldBreak = false;
  for (var i = 0; i < renderers.length; i++) {
    var _renderer$rendererCon;
    if (shouldBreak) {
      break;
    }
    var renderer = renderers[i];
    if ((renderer == null ? void 0 : (_renderer$rendererCon = renderer.rendererConfig) == null ? void 0 : _renderer$rendererCon.getInspectorDataForViewAtPoint) != null) {
      renderer.rendererConfig.getInspectorDataForViewAtPoint(inspectedView, locationX, locationY, function (viewData) {
        if (viewData && viewData.hierarchy.length > 0) {
          shouldBreak = callback(viewData);
        }
      });
    }
  }
};
//# sourceMappingURL=getInspectorDataForViewAtPoint.js.map