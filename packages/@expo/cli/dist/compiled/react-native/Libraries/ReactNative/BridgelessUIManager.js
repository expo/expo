'use strict';

var _NativeComponentRegistryUnstable = require("../NativeComponent/NativeComponentRegistryUnstable");
var errorMessageForMethod = function errorMessageForMethod(methodName) {
  return "[ReactNative Architecture][JS] '" + methodName + "' is not available in the new React Native architecture.";
};
module.exports = {
  getViewManagerConfig: function getViewManagerConfig(viewManagerName) {
    console.error(errorMessageForMethod('getViewManagerConfig') + 'Use hasViewManagerConfig instead. viewManagerName: ' + viewManagerName);
    return null;
  },
  hasViewManagerConfig: function hasViewManagerConfig(viewManagerName) {
    return (0, _NativeComponentRegistryUnstable.unstable_hasComponent)(viewManagerName);
  },
  getConstants: function getConstants() {
    console.error(errorMessageForMethod('getConstants'));
    return {};
  },
  getConstantsForViewManager: function getConstantsForViewManager(viewManagerName) {
    console.error(errorMessageForMethod('getConstantsForViewManager'));
    return {};
  },
  getDefaultEventTypes: function getDefaultEventTypes() {
    console.error(errorMessageForMethod('getDefaultEventTypes'));
    return [];
  },
  lazilyLoadView: function lazilyLoadView(name) {
    console.error(errorMessageForMethod('lazilyLoadView'));
    return {};
  },
  createView: function createView(reactTag, viewName, rootTag, props) {
    return console.error(errorMessageForMethod('createView'));
  },
  updateView: function updateView(reactTag, viewName, props) {
    return console.error(errorMessageForMethod('updateView'));
  },
  focus: function focus(reactTag) {
    return console.error(errorMessageForMethod('focus'));
  },
  blur: function blur(reactTag) {
    return console.error(errorMessageForMethod('blur'));
  },
  findSubviewIn: function findSubviewIn(reactTag, point, callback) {
    return console.error(errorMessageForMethod('findSubviewIn'));
  },
  dispatchViewManagerCommand: function dispatchViewManagerCommand(reactTag, commandID, commandArgs) {
    return console.error(errorMessageForMethod('dispatchViewManagerCommand'));
  },
  measure: function measure(reactTag, callback) {
    return console.error(errorMessageForMethod('measure'));
  },
  measureInWindow: function measureInWindow(reactTag, callback) {
    return console.error(errorMessageForMethod('measureInWindow'));
  },
  viewIsDescendantOf: function viewIsDescendantOf(reactTag, ancestorReactTag, callback) {
    return console.error(errorMessageForMethod('viewIsDescendantOf'));
  },
  measureLayout: function measureLayout(reactTag, ancestorReactTag, errorCallback, callback) {
    return console.error(errorMessageForMethod('measureLayout'));
  },
  measureLayoutRelativeToParent: function measureLayoutRelativeToParent(reactTag, errorCallback, callback) {
    return console.error(errorMessageForMethod('measureLayoutRelativeToParent'));
  },
  setJSResponder: function setJSResponder(reactTag, blockNativeResponder) {
    return console.error(errorMessageForMethod('setJSResponder'));
  },
  clearJSResponder: function clearJSResponder() {},
  configureNextLayoutAnimation: function configureNextLayoutAnimation(config, callback, errorCallback) {
    return console.error(errorMessageForMethod('configureNextLayoutAnimation'));
  },
  removeSubviewsFromContainerWithID: function removeSubviewsFromContainerWithID(containerID) {
    return console.error(errorMessageForMethod('removeSubviewsFromContainerWithID'));
  },
  replaceExistingNonRootView: function replaceExistingNonRootView(reactTag, newReactTag) {
    return console.error(errorMessageForMethod('replaceExistingNonRootView'));
  },
  setChildren: function setChildren(containerTag, reactTags) {
    return console.error(errorMessageForMethod('setChildren'));
  },
  manageChildren: function manageChildren(containerTag, moveFromIndices, moveToIndices, addChildReactTags, addAtIndices, removeAtIndices) {
    return console.error(errorMessageForMethod('manageChildren'));
  },
  setLayoutAnimationEnabledExperimental: function setLayoutAnimationEnabledExperimental(enabled) {
    console.error(errorMessageForMethod('setLayoutAnimationEnabledExperimental'));
  },
  sendAccessibilityEvent: function sendAccessibilityEvent(reactTag, eventType) {
    return console.error(errorMessageForMethod('sendAccessibilityEvent'));
  },
  showPopupMenu: function showPopupMenu(reactTag, items, error, success) {
    return console.error(errorMessageForMethod('showPopupMenu'));
  },
  dismissPopupMenu: function dismissPopupMenu() {
    return console.error(errorMessageForMethod('dismissPopupMenu'));
  }
};
//# sourceMappingURL=BridgelessUIManager.js.map