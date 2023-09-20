Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unstable_hasComponent = unstable_hasComponent;
var componentNameToExists = new Map();
function unstable_hasComponent(name) {
  var hasNativeComponent = componentNameToExists.get(name);
  if (hasNativeComponent == null) {
    if (global.__nativeComponentRegistry__hasComponent) {
      hasNativeComponent = global.__nativeComponentRegistry__hasComponent(name);
      componentNameToExists.set(name, hasNativeComponent);
    } else {
      throw `unstable_hasComponent('${name}'): Global function is not registered`;
    }
  }
  return hasNativeComponent;
}
//# sourceMappingURL=NativeComponentRegistryUnstable.js.map