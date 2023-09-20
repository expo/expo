var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.__INTERNAL_VIEW_CONFIG = void 0;
var NativeComponentRegistry = _interopRequireWildcard(require("../NativeComponent/NativeComponentRegistry"));
var _ViewConfigIgnore = require("../NativeComponent/ViewConfigIgnore");
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var __INTERNAL_VIEW_CONFIG = _Platform.default.OS === 'android' ? {
  uiViewClassName: 'RCTImageView',
  bubblingEventTypes: {},
  directEventTypes: {
    topLoadStart: {
      registrationName: 'onLoadStart'
    },
    topProgress: {
      registrationName: 'onProgress'
    },
    topError: {
      registrationName: 'onError'
    },
    topLoad: {
      registrationName: 'onLoad'
    },
    topLoadEnd: {
      registrationName: 'onLoadEnd'
    }
  },
  validAttributes: {
    blurRadius: true,
    internal_analyticTag: true,
    resizeMode: true,
    tintColor: {
      process: require("../StyleSheet/processColor").default
    },
    borderBottomLeftRadius: true,
    borderTopLeftRadius: true,
    resizeMethod: true,
    src: true,
    borderRadius: true,
    headers: true,
    shouldNotifyLoadEvents: true,
    defaultSrc: true,
    overlayColor: {
      process: require("../StyleSheet/processColor").default
    },
    borderColor: {
      process: require("../StyleSheet/processColor").default
    },
    accessible: true,
    progressiveRenderingEnabled: true,
    fadeDuration: true,
    borderBottomRightRadius: true,
    borderTopRightRadius: true,
    loadingIndicatorSrc: true
  }
} : {
  uiViewClassName: 'RCTImageView',
  bubblingEventTypes: {},
  directEventTypes: {
    topLoadStart: {
      registrationName: 'onLoadStart'
    },
    topProgress: {
      registrationName: 'onProgress'
    },
    topError: {
      registrationName: 'onError'
    },
    topPartialLoad: {
      registrationName: 'onPartialLoad'
    },
    topLoad: {
      registrationName: 'onLoad'
    },
    topLoadEnd: {
      registrationName: 'onLoadEnd'
    }
  },
  validAttributes: Object.assign({
    blurRadius: true,
    capInsets: {
      diff: require("../Utilities/differ/insetsDiffer")
    },
    defaultSource: {
      process: require("./resolveAssetSource")
    },
    internal_analyticTag: true,
    resizeMode: true,
    source: true,
    tintColor: {
      process: require("../StyleSheet/processColor").default
    }
  }, (0, _ViewConfigIgnore.ConditionallyIgnoredEventHandlers)({
    onLoadStart: true,
    onLoad: true,
    onLoadEnd: true,
    onProgress: true,
    onError: true,
    onPartialLoad: true
  }))
};
exports.__INTERNAL_VIEW_CONFIG = __INTERNAL_VIEW_CONFIG;
var ImageViewNativeComponent = NativeComponentRegistry.get('RCTImageView', function () {
  return __INTERNAL_VIEW_CONFIG;
});
var _default = ImageViewNativeComponent;
exports.default = _default;
//# sourceMappingURL=ImageViewNativeComponent.js.map