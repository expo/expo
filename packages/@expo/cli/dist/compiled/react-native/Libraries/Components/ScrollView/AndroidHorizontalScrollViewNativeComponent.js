Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.__INTERNAL_VIEW_CONFIG = void 0;
var NativeComponentRegistry = _interopRequireWildcard(require("../../NativeComponent/NativeComponentRegistry"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var __INTERNAL_VIEW_CONFIG = {
  uiViewClassName: 'AndroidHorizontalScrollView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    decelerationRate: true,
    disableIntervalMomentum: true,
    endFillColor: {
      process: require('../../StyleSheet/processColor').default
    },
    fadingEdgeLength: true,
    nestedScrollEnabled: true,
    overScrollMode: true,
    pagingEnabled: true,
    persistentScrollbar: true,
    scrollEnabled: true,
    scrollPerfTag: true,
    sendMomentumEvents: true,
    showsHorizontalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToStart: true,
    snapToOffsets: true,
    contentOffset: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    borderRadius: true,
    borderStyle: true,
    borderRightColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderBottomColor: {
      process: require('../../StyleSheet/processColor').default
    },
    borderTopLeftRadius: true,
    borderTopColor: {
      process: require('../../StyleSheet/processColor').default
    },
    removeClippedSubviews: true,
    borderTopRightRadius: true,
    borderLeftColor: {
      process: require('../../StyleSheet/processColor').default
    },
    pointerEvents: true
  }
};
exports.__INTERNAL_VIEW_CONFIG = __INTERNAL_VIEW_CONFIG;
var AndroidHorizontalScrollViewNativeComponent = NativeComponentRegistry.get('AndroidHorizontalScrollView', function () {
  return __INTERNAL_VIEW_CONFIG;
});
var _default = AndroidHorizontalScrollViewNativeComponent;
exports.default = _default;
//# sourceMappingURL=AndroidHorizontalScrollViewNativeComponent.js.map