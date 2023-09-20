var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../../EventEmitter/RCTDeviceEventEmitter"));
var _RendererProxy = require("../../ReactNative/RendererProxy");
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _legacySendAccessibilityEvent = _interopRequireDefault(require("./legacySendAccessibilityEvent"));
var _NativeAccessibilityInfo = _interopRequireDefault(require("./NativeAccessibilityInfo"));
var _NativeAccessibilityManager = _interopRequireDefault(require("./NativeAccessibilityManager"));
var EventNames = _Platform.default.OS === 'android' ? new Map([['change', 'touchExplorationDidChange'], ['reduceMotionChanged', 'reduceMotionDidChange'], ['screenReaderChanged', 'touchExplorationDidChange'], ['accessibilityServiceChanged', 'accessibilityServiceDidChange']]) : new Map([['announcementFinished', 'announcementFinished'], ['boldTextChanged', 'boldTextChanged'], ['change', 'screenReaderChanged'], ['grayscaleChanged', 'grayscaleChanged'], ['invertColorsChanged', 'invertColorsChanged'], ['reduceMotionChanged', 'reduceMotionChanged'], ['reduceTransparencyChanged', 'reduceTransparencyChanged'], ['screenReaderChanged', 'screenReaderChanged']]);
var AccessibilityInfo = {
  isBoldTextEnabled: function isBoldTextEnabled() {
    if (_Platform.default.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise(function (resolve, reject) {
        if (_NativeAccessibilityManager.default != null) {
          _NativeAccessibilityManager.default.getCurrentBoldTextState(resolve, reject);
        } else {
          reject(null);
        }
      });
    }
  },
  isGrayscaleEnabled: function isGrayscaleEnabled() {
    if (_Platform.default.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise(function (resolve, reject) {
        if (_NativeAccessibilityManager.default != null) {
          _NativeAccessibilityManager.default.getCurrentGrayscaleState(resolve, reject);
        } else {
          reject(null);
        }
      });
    }
  },
  isInvertColorsEnabled: function isInvertColorsEnabled() {
    if (_Platform.default.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise(function (resolve, reject) {
        if (_NativeAccessibilityManager.default != null) {
          _NativeAccessibilityManager.default.getCurrentInvertColorsState(resolve, reject);
        } else {
          reject(null);
        }
      });
    }
  },
  isReduceMotionEnabled: function isReduceMotionEnabled() {
    return new Promise(function (resolve, reject) {
      if (_Platform.default.OS === 'android') {
        if (_NativeAccessibilityInfo.default != null) {
          _NativeAccessibilityInfo.default.isReduceMotionEnabled(resolve);
        } else {
          reject(null);
        }
      } else {
        if (_NativeAccessibilityManager.default != null) {
          _NativeAccessibilityManager.default.getCurrentReduceMotionState(resolve, reject);
        } else {
          reject(null);
        }
      }
    });
  },
  prefersCrossFadeTransitions: function prefersCrossFadeTransitions() {
    return new Promise(function (resolve, reject) {
      if (_Platform.default.OS === 'android') {
        return Promise.resolve(false);
      } else {
        if ((_NativeAccessibilityManager.default == null ? void 0 : _NativeAccessibilityManager.default.getCurrentPrefersCrossFadeTransitionsState) != null) {
          _NativeAccessibilityManager.default.getCurrentPrefersCrossFadeTransitionsState(resolve, reject);
        } else {
          reject(null);
        }
      }
    });
  },
  isReduceTransparencyEnabled: function isReduceTransparencyEnabled() {
    if (_Platform.default.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise(function (resolve, reject) {
        if (_NativeAccessibilityManager.default != null) {
          _NativeAccessibilityManager.default.getCurrentReduceTransparencyState(resolve, reject);
        } else {
          reject(null);
        }
      });
    }
  },
  isScreenReaderEnabled: function isScreenReaderEnabled() {
    return new Promise(function (resolve, reject) {
      if (_Platform.default.OS === 'android') {
        if (_NativeAccessibilityInfo.default != null) {
          _NativeAccessibilityInfo.default.isTouchExplorationEnabled(resolve);
        } else {
          reject(null);
        }
      } else {
        if (_NativeAccessibilityManager.default != null) {
          _NativeAccessibilityManager.default.getCurrentVoiceOverState(resolve, reject);
        } else {
          reject(null);
        }
      }
    });
  },
  isAccessibilityServiceEnabled: function isAccessibilityServiceEnabled() {
    return new Promise(function (resolve, reject) {
      if (_Platform.default.OS === 'android') {
        if (_NativeAccessibilityInfo.default != null && _NativeAccessibilityInfo.default.isAccessibilityServiceEnabled != null) {
          _NativeAccessibilityInfo.default.isAccessibilityServiceEnabled(resolve);
        } else {
          reject(null);
        }
      } else {
        reject(null);
      }
    });
  },
  addEventListener: function addEventListener(eventName, handler) {
    var deviceEventName = EventNames.get(eventName);
    return deviceEventName == null ? {
      remove: function remove() {}
    } : _RCTDeviceEventEmitter.default.addListener(deviceEventName, handler);
  },
  setAccessibilityFocus: function setAccessibilityFocus(reactTag) {
    (0, _legacySendAccessibilityEvent.default)(reactTag, 'focus');
  },
  sendAccessibilityEvent: function sendAccessibilityEvent(handle, eventType) {
    if (_Platform.default.OS === 'ios' && eventType === 'click') {
      return;
    }
    (0, _RendererProxy.sendAccessibilityEvent)(handle, eventType);
  },
  announceForAccessibility: function announceForAccessibility(announcement) {
    if (_Platform.default.OS === 'android') {
      _NativeAccessibilityInfo.default == null ? void 0 : _NativeAccessibilityInfo.default.announceForAccessibility(announcement);
    } else {
      _NativeAccessibilityManager.default == null ? void 0 : _NativeAccessibilityManager.default.announceForAccessibility(announcement);
    }
  },
  announceForAccessibilityWithOptions: function announceForAccessibilityWithOptions(announcement, options) {
    if (_Platform.default.OS === 'android') {
      _NativeAccessibilityInfo.default == null ? void 0 : _NativeAccessibilityInfo.default.announceForAccessibility(announcement);
    } else {
      if (_NativeAccessibilityManager.default != null && _NativeAccessibilityManager.default.announceForAccessibilityWithOptions) {
        _NativeAccessibilityManager.default == null ? void 0 : _NativeAccessibilityManager.default.announceForAccessibilityWithOptions(announcement, options);
      } else {
        _NativeAccessibilityManager.default == null ? void 0 : _NativeAccessibilityManager.default.announceForAccessibility(announcement);
      }
    }
  },
  getRecommendedTimeoutMillis: function getRecommendedTimeoutMillis(originalTimeout) {
    if (_Platform.default.OS === 'android') {
      return new Promise(function (resolve, reject) {
        if (_NativeAccessibilityInfo.default != null && _NativeAccessibilityInfo.default.getRecommendedTimeoutMillis) {
          _NativeAccessibilityInfo.default.getRecommendedTimeoutMillis(originalTimeout, resolve);
        } else {
          resolve(originalTimeout);
        }
      });
    } else {
      return Promise.resolve(originalTimeout);
    }
  }
};
var _default = AccessibilityInfo;
exports.default = _default;
//# sourceMappingURL=AccessibilityInfo.js.map