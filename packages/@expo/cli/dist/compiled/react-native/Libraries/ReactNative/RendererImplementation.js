Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatchCommand = dispatchCommand;
exports.findHostInstance_DEPRECATED = findHostInstance_DEPRECATED;
exports.findNodeHandle = findNodeHandle;
exports.isProfilingRenderer = isProfilingRenderer;
exports.renderElement = renderElement;
exports.sendAccessibilityEvent = sendAccessibilityEvent;
exports.unmountComponentAtNodeAndRemoveContainer = unmountComponentAtNodeAndRemoveContainer;
exports.unstable_batchedUpdates = unstable_batchedUpdates;
function renderElement(_ref) {
  var element = _ref.element,
    rootTag = _ref.rootTag,
    useFabric = _ref.useFabric,
    useConcurrentRoot = _ref.useConcurrentRoot;
  if (useFabric) {
    require('../Renderer/shims/ReactFabric').render(element, rootTag, null, useConcurrentRoot);
  } else {
    require('../Renderer/shims/ReactNative').render(element, rootTag);
  }
}
function findHostInstance_DEPRECATED(componentOrHandle) {
  return require('../Renderer/shims/ReactNative').findHostInstance_DEPRECATED(componentOrHandle);
}
function findNodeHandle(componentOrHandle) {
  return require('../Renderer/shims/ReactNative').findNodeHandle(componentOrHandle);
}
function dispatchCommand(handle, command, args) {
  if (global.RN$Bridgeless === true) {
    return require('../Renderer/shims/ReactFabric').dispatchCommand(handle, command, args);
  } else {
    return require('../Renderer/shims/ReactNative').dispatchCommand(handle, command, args);
  }
}
function sendAccessibilityEvent(handle, eventType) {
  return require('../Renderer/shims/ReactNative').sendAccessibilityEvent(handle, eventType);
}
function unmountComponentAtNodeAndRemoveContainer(rootTag) {
  var rootTagAsNumber = rootTag;
  require('../Renderer/shims/ReactNative').unmountComponentAtNodeAndRemoveContainer(rootTagAsNumber);
}
function unstable_batchedUpdates(fn, bookkeeping) {
  return require('../Renderer/shims/ReactNative').unstable_batchedUpdates(fn, bookkeeping);
}
function isProfilingRenderer() {
  return Boolean(__DEV__);
}