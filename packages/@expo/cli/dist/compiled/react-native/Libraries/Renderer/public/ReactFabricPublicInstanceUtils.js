Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPublicInstance = isPublicInstance;
function isPublicInstance(maybeInstance) {
  return maybeInstance != null && (maybeInstance.__nativeTag != null || isLegacyFabricInstance(maybeInstance));
}
function isLegacyFabricInstance(maybeInstance) {
  return maybeInstance != null && maybeInstance['_internalInstanceHandle'] != null && maybeInstance['_internalInstanceHandle'].stateNode != null && maybeInstance['_internalInstanceHandle'].stateNode.canonical != null;
}