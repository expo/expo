module.exports = {
  get BatchedBridge() {
    return require('../BatchedBridge/BatchedBridge');
  },
  get ExceptionsManager() {
    return require('../Core/ExceptionsManager');
  },
  get Platform() {
    return require('../Utilities/Platform');
  },
  get RCTEventEmitter() {
    return require('../EventEmitter/RCTEventEmitter');
  },
  get ReactNativeViewConfigRegistry() {
    return require('../Renderer/shims/ReactNativeViewConfigRegistry');
  },
  get TextInputState() {
    return require('../Components/TextInput/TextInputState');
  },
  get UIManager() {
    return require('../ReactNative/UIManager');
  },
  get deepDiffer() {
    return require('../Utilities/differ/deepDiffer');
  },
  get deepFreezeAndThrowOnMutationInDev() {
    return require('../Utilities/deepFreezeAndThrowOnMutationInDev');
  },
  get flattenStyle() {
    return require('../StyleSheet/flattenStyle');
  },
  get ReactFiberErrorDialog() {
    return require('../Core/ReactFiberErrorDialog').default;
  },
  get legacySendAccessibilityEvent() {
    return require('../Components/AccessibilityInfo/legacySendAccessibilityEvent');
  },
  get RawEventEmitter() {
    return require('../Core/RawEventEmitter').default;
  },
  get CustomEvent() {
    return require('../Events/CustomEvent').default;
  }
};
//# sourceMappingURL=ReactNativePrivateInterface.js.map