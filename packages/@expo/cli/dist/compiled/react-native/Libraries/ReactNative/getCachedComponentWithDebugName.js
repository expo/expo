Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getCachedComponentWithDisplayName;
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var cache = new Map();
function getCachedComponentWithDisplayName(displayName) {
  var ComponentWithDisplayName = cache.get(displayName);
  if (!ComponentWithDisplayName) {
    ComponentWithDisplayName = function ComponentWithDisplayName(_ref) {
      var children = _ref.children;
      return children;
    };
    ComponentWithDisplayName.displayName = displayName;
    cache.set(displayName, ComponentWithDisplayName);
  }
  return ComponentWithDisplayName;
}
//# sourceMappingURL=getCachedComponentWithDebugName.js.map