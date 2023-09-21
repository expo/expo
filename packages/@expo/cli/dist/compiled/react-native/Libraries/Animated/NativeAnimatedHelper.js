var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var _ReactNativeFeatureFlags = _interopRequireDefault(require("../ReactNative/ReactNativeFeatureFlags"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _NativeAnimatedModule = _interopRequireDefault(require("./NativeAnimatedModule"));
var _NativeAnimatedTurboModule = _interopRequireDefault(require("./NativeAnimatedTurboModule"));
var _invariant = _interopRequireDefault(require("invariant"));
var NativeAnimatedModule = _Platform.default.OS === 'ios' && global.RN$Bridgeless === true ? _NativeAnimatedTurboModule.default : _NativeAnimatedModule.default;
var __nativeAnimatedNodeTagCount = 1;
var __nativeAnimationIdCount = 1;
var nativeEventEmitter;
var waitingForQueuedOperations = new Set();
var queueOperations = false;
var queue = [];
var singleOpQueue = [];
var useSingleOpBatching = _Platform.default.OS === 'android' && !!(NativeAnimatedModule != null && NativeAnimatedModule.queueAndExecuteBatchedOperations) && _ReactNativeFeatureFlags.default.animatedShouldUseSingleOp();
var flushQueueTimeout = null;
var eventListenerGetValueCallbacks = {};
var eventListenerAnimationFinishedCallbacks = {};
var globalEventEmitterGetValueListener = null;
var globalEventEmitterAnimationFinishedListener = null;
var nativeOps = useSingleOpBatching ? function () {
  var apis = ['createAnimatedNode', 'updateAnimatedNodeConfig', 'getValue', 'startListeningToAnimatedNodeValue', 'stopListeningToAnimatedNodeValue', 'connectAnimatedNodes', 'disconnectAnimatedNodes', 'startAnimatingNode', 'stopAnimation', 'setAnimatedNodeValue', 'setAnimatedNodeOffset', 'flattenAnimatedNodeOffset', 'extractAnimatedNodeOffset', 'connectAnimatedNodeToView', 'disconnectAnimatedNodeFromView', 'restoreDefaultValues', 'dropAnimatedNode', 'addAnimatedEventToView', 'removeAnimatedEventFromView', 'addListener', 'removeListener'];
  return apis.reduce(function (acc, functionName, i) {
    acc[functionName] = i + 1;
    return acc;
  }, {});
}() : NativeAnimatedModule;
var API = {
  getValue: function getValue(tag, saveValueCallback) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    if (useSingleOpBatching) {
      if (saveValueCallback) {
        eventListenerGetValueCallbacks[tag] = saveValueCallback;
      }
      API.queueOperation(nativeOps.getValue, tag);
    } else {
      API.queueOperation(nativeOps.getValue, tag, saveValueCallback);
    }
  },
  setWaitingForIdentifier: function setWaitingForIdentifier(id) {
    waitingForQueuedOperations.add(id);
    queueOperations = true;
    if (_ReactNativeFeatureFlags.default.animatedShouldDebounceQueueFlush() && flushQueueTimeout) {
      clearTimeout(flushQueueTimeout);
    }
  },
  unsetWaitingForIdentifier: function unsetWaitingForIdentifier(id) {
    waitingForQueuedOperations.delete(id);
    if (waitingForQueuedOperations.size === 0) {
      queueOperations = false;
      API.disableQueue();
    }
  },
  disableQueue: function disableQueue() {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    if (_ReactNativeFeatureFlags.default.animatedShouldDebounceQueueFlush()) {
      var prevTimeout = flushQueueTimeout;
      clearImmediate(prevTimeout);
      flushQueueTimeout = setImmediate(API.flushQueue);
    } else {
      API.flushQueue();
    }
  },
  flushQueue: function flushQueue() {
    (0, _invariant.default)(NativeAnimatedModule || process.env.NODE_ENV === 'test', 'Native animated module is not available');
    flushQueueTimeout = null;
    if (useSingleOpBatching && singleOpQueue.length === 0) {
      return;
    }
    if (!useSingleOpBatching && queue.length === 0) {
      return;
    }
    if (useSingleOpBatching) {
      if (!globalEventEmitterGetValueListener || !globalEventEmitterAnimationFinishedListener) {
        setupGlobalEventEmitterListeners();
      }
      NativeAnimatedModule == null ? void 0 : NativeAnimatedModule.queueAndExecuteBatchedOperations == null ? void 0 : NativeAnimatedModule.queueAndExecuteBatchedOperations(singleOpQueue);
      singleOpQueue.length = 0;
    } else {
      _Platform.default.OS === 'android' && (NativeAnimatedModule == null ? void 0 : NativeAnimatedModule.startOperationBatch == null ? void 0 : NativeAnimatedModule.startOperationBatch());
      for (var q = 0, l = queue.length; q < l; q++) {
        queue[q]();
      }
      queue.length = 0;
      _Platform.default.OS === 'android' && (NativeAnimatedModule == null ? void 0 : NativeAnimatedModule.finishOperationBatch == null ? void 0 : NativeAnimatedModule.finishOperationBatch());
    }
  },
  queueOperation: function queueOperation(fn) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    if (useSingleOpBatching) {
      singleOpQueue.push.apply(singleOpQueue, [fn].concat(args));
      return;
    }
    if (queueOperations || queue.length !== 0) {
      queue.push(function () {
        return fn.apply(void 0, args);
      });
    } else {
      fn.apply(void 0, args);
    }
  },
  createAnimatedNode: function createAnimatedNode(tag, config) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.createAnimatedNode, tag, config);
  },
  updateAnimatedNodeConfig: function updateAnimatedNodeConfig(tag, config) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    if (nativeOps.updateAnimatedNodeConfig) {
      API.queueOperation(nativeOps.updateAnimatedNodeConfig, tag, config);
    }
  },
  startListeningToAnimatedNodeValue: function startListeningToAnimatedNodeValue(tag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.startListeningToAnimatedNodeValue, tag);
  },
  stopListeningToAnimatedNodeValue: function stopListeningToAnimatedNodeValue(tag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.stopListeningToAnimatedNodeValue, tag);
  },
  connectAnimatedNodes: function connectAnimatedNodes(parentTag, childTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.connectAnimatedNodes, parentTag, childTag);
  },
  disconnectAnimatedNodes: function disconnectAnimatedNodes(parentTag, childTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.disconnectAnimatedNodes, parentTag, childTag);
  },
  startAnimatingNode: function startAnimatingNode(animationId, nodeTag, config, endCallback) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    if (useSingleOpBatching) {
      if (endCallback) {
        eventListenerAnimationFinishedCallbacks[animationId] = endCallback;
      }
      API.queueOperation(nativeOps.startAnimatingNode, animationId, nodeTag, config);
    } else {
      API.queueOperation(nativeOps.startAnimatingNode, animationId, nodeTag, config, endCallback);
    }
  },
  stopAnimation: function stopAnimation(animationId) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.stopAnimation, animationId);
  },
  setAnimatedNodeValue: function setAnimatedNodeValue(nodeTag, value) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.setAnimatedNodeValue, nodeTag, value);
  },
  setAnimatedNodeOffset: function setAnimatedNodeOffset(nodeTag, offset) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.setAnimatedNodeOffset, nodeTag, offset);
  },
  flattenAnimatedNodeOffset: function flattenAnimatedNodeOffset(nodeTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.flattenAnimatedNodeOffset, nodeTag);
  },
  extractAnimatedNodeOffset: function extractAnimatedNodeOffset(nodeTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.extractAnimatedNodeOffset, nodeTag);
  },
  connectAnimatedNodeToView: function connectAnimatedNodeToView(nodeTag, viewTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.connectAnimatedNodeToView, nodeTag, viewTag);
  },
  disconnectAnimatedNodeFromView: function disconnectAnimatedNodeFromView(nodeTag, viewTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.disconnectAnimatedNodeFromView, nodeTag, viewTag);
  },
  restoreDefaultValues: function restoreDefaultValues(nodeTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    if (nativeOps.restoreDefaultValues != null) {
      API.queueOperation(nativeOps.restoreDefaultValues, nodeTag);
    }
  },
  dropAnimatedNode: function dropAnimatedNode(tag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.dropAnimatedNode, tag);
  },
  addAnimatedEventToView: function addAnimatedEventToView(viewTag, eventName, eventMapping) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.addAnimatedEventToView, viewTag, eventName, eventMapping);
  },
  removeAnimatedEventFromView: function removeAnimatedEventFromView(viewTag, eventName, animatedNodeTag) {
    (0, _invariant.default)(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.removeAnimatedEventFromView, viewTag, eventName, animatedNodeTag);
  }
};
function setupGlobalEventEmitterListeners() {
  globalEventEmitterGetValueListener = _RCTDeviceEventEmitter.default.addListener('onNativeAnimatedModuleGetValue', function (params) {
    var tag = params.tag;
    var callback = eventListenerGetValueCallbacks[tag];
    if (!callback) {
      return;
    }
    callback(params.value);
    delete eventListenerGetValueCallbacks[tag];
  });
  globalEventEmitterAnimationFinishedListener = _RCTDeviceEventEmitter.default.addListener('onNativeAnimatedModuleAnimationFinished', function (params) {
    var animationId = params.animationId;
    var callback = eventListenerAnimationFinishedCallbacks[animationId];
    if (!callback) {
      return;
    }
    callback(params);
    delete eventListenerAnimationFinishedCallbacks[animationId];
  });
}
var SUPPORTED_COLOR_STYLES = {
  backgroundColor: true,
  borderBottomColor: true,
  borderColor: true,
  borderEndColor: true,
  borderLeftColor: true,
  borderRightColor: true,
  borderStartColor: true,
  borderTopColor: true,
  color: true,
  tintColor: true
};
var SUPPORTED_STYLES = Object.assign({}, SUPPORTED_COLOR_STYLES, {
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderRadius: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  elevation: true,
  opacity: true,
  transform: true,
  zIndex: true,
  shadowOpacity: true,
  shadowRadius: true,
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true
});
var SUPPORTED_TRANSFORMS = {
  translateX: true,
  translateY: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  rotateZ: true,
  perspective: true
};
var SUPPORTED_INTERPOLATION_PARAMS = {
  inputRange: true,
  outputRange: true,
  extrapolate: true,
  extrapolateRight: true,
  extrapolateLeft: true
};
function addWhitelistedStyleProp(prop) {
  SUPPORTED_STYLES[prop] = true;
}
function addWhitelistedTransformProp(prop) {
  SUPPORTED_TRANSFORMS[prop] = true;
}
function addWhitelistedInterpolationParam(param) {
  SUPPORTED_INTERPOLATION_PARAMS[param] = true;
}
function isSupportedColorStyleProp(prop) {
  return SUPPORTED_COLOR_STYLES.hasOwnProperty(prop);
}
function isSupportedStyleProp(prop) {
  return SUPPORTED_STYLES.hasOwnProperty(prop);
}
function isSupportedTransformProp(prop) {
  return SUPPORTED_TRANSFORMS.hasOwnProperty(prop);
}
function isSupportedInterpolationParam(param) {
  return SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(param);
}
function validateTransform(configs) {
  configs.forEach(function (config) {
    if (!isSupportedTransformProp(config.property)) {
      throw new Error(`Property '${config.property}' is not supported by native animated module`);
    }
  });
}
function validateStyles(styles) {
  for (var _key2 in styles) {
    if (!isSupportedStyleProp(_key2)) {
      throw new Error(`Style property '${_key2}' is not supported by native animated module`);
    }
  }
}
function validateInterpolation(config) {
  for (var _key3 in config) {
    if (!isSupportedInterpolationParam(_key3)) {
      throw new Error(`Interpolation property '${_key3}' is not supported by native animated module`);
    }
  }
}
function generateNewNodeTag() {
  return __nativeAnimatedNodeTagCount++;
}
function generateNewAnimationId() {
  return __nativeAnimationIdCount++;
}
function assertNativeAnimatedModule() {
  (0, _invariant.default)(NativeAnimatedModule, 'Native animated module is not available');
}
var _warnedMissingNativeAnimated = false;
function shouldUseNativeDriver(config) {
  if (config.useNativeDriver == null) {
    console.warn('Animated: `useNativeDriver` was not specified. This is a required ' + 'option and must be explicitly set to `true` or `false`');
  }
  if (config.useNativeDriver === true && !NativeAnimatedModule) {
    if (process.env.NODE_ENV !== 'test') {
      if (!_warnedMissingNativeAnimated) {
        console.warn('Animated: `useNativeDriver` is not supported because the native ' + 'animated module is missing. Falling back to JS-based animation. To ' + 'resolve this, add `RCTAnimation` module to this app, or remove ' + '`useNativeDriver`. ' + 'Make sure to run `bundle exec pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md');
        _warnedMissingNativeAnimated = true;
      }
    }
    return false;
  }
  return config.useNativeDriver || false;
}
function transformDataType(value) {
  if (typeof value !== 'string') {
    return value;
  }
  if (/deg$/.test(value)) {
    var degrees = parseFloat(value) || 0;
    var radians = degrees * Math.PI / 180.0;
    return radians;
  } else {
    return value;
  }
}
var _default = {
  API: API,
  isSupportedColorStyleProp: isSupportedColorStyleProp,
  isSupportedStyleProp: isSupportedStyleProp,
  isSupportedTransformProp: isSupportedTransformProp,
  isSupportedInterpolationParam: isSupportedInterpolationParam,
  addWhitelistedStyleProp: addWhitelistedStyleProp,
  addWhitelistedTransformProp: addWhitelistedTransformProp,
  addWhitelistedInterpolationParam: addWhitelistedInterpolationParam,
  validateStyles: validateStyles,
  validateTransform: validateTransform,
  validateInterpolation: validateInterpolation,
  generateNewNodeTag: generateNewNodeTag,
  generateNewAnimationId: generateNewAnimationId,
  assertNativeAnimatedModule: assertNativeAnimatedModule,
  shouldUseNativeDriver: shouldUseNativeDriver,
  transformDataType: transformDataType,
  get nativeEventEmitter() {
    if (!nativeEventEmitter) {
      nativeEventEmitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : NativeAnimatedModule);
    }
    return nativeEventEmitter;
  }
};
exports.default = _default;