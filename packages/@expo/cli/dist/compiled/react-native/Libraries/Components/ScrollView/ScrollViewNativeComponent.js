var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.__INTERNAL_VIEW_CONFIG = void 0;
var NativeComponentRegistry = _interopRequireWildcard(require("../../NativeComponent/NativeComponentRegistry"));
var _ViewConfigIgnore = require("../../NativeComponent/ViewConfigIgnore");
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var __INTERNAL_VIEW_CONFIG = _Platform.default.OS === 'android' ? {
  uiViewClassName: 'RCTScrollView',
  bubblingEventTypes: {},
  directEventTypes: {
    topMomentumScrollBegin: {
      registrationName: 'onMomentumScrollBegin'
    },
    topMomentumScrollEnd: {
      registrationName: 'onMomentumScrollEnd'
    },
    topScroll: {
      registrationName: 'onScroll'
    },
    topScrollBeginDrag: {
      registrationName: 'onScrollBeginDrag'
    },
    topScrollEndDrag: {
      registrationName: 'onScrollEndDrag'
    }
  },
  validAttributes: {
    contentOffset: {
      diff: require('../../Utilities/differ/pointsDiffer')
    },
    decelerationRate: true,
    disableIntervalMomentum: true,
    pagingEnabled: true,
    scrollEnabled: true,
    showsVerticalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToOffsets: true,
    snapToStart: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    sendMomentumEvents: true,
    borderRadius: true,
    nestedScrollEnabled: true,
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
    persistentScrollbar: true,
    endFillColor: {
      process: require('../../StyleSheet/processColor').default
    },
    fadingEdgeLength: true,
    overScrollMode: true,
    borderTopLeftRadius: true,
    scrollPerfTag: true,
    borderTopColor: {
      process: require('../../StyleSheet/processColor').default
    },
    removeClippedSubviews: true,
    borderTopRightRadius: true,
    borderLeftColor: {
      process: require('../../StyleSheet/processColor').default
    },
    pointerEvents: true,
    isInvertedVirtualizedList: true
  }
} : {
  uiViewClassName: 'RCTScrollView',
  bubblingEventTypes: {},
  directEventTypes: {
    topMomentumScrollBegin: {
      registrationName: 'onMomentumScrollBegin'
    },
    topMomentumScrollEnd: {
      registrationName: 'onMomentumScrollEnd'
    },
    topScroll: {
      registrationName: 'onScroll'
    },
    topScrollBeginDrag: {
      registrationName: 'onScrollBeginDrag'
    },
    topScrollEndDrag: {
      registrationName: 'onScrollEndDrag'
    },
    topScrollToTop: {
      registrationName: 'onScrollToTop'
    }
  },
  validAttributes: Object.assign({
    alwaysBounceHorizontal: true,
    alwaysBounceVertical: true,
    automaticallyAdjustContentInsets: true,
    automaticallyAdjustKeyboardInsets: true,
    automaticallyAdjustsScrollIndicatorInsets: true,
    bounces: true,
    bouncesZoom: true,
    canCancelContentTouches: true,
    centerContent: true,
    contentInset: {
      diff: require('../../Utilities/differ/insetsDiffer')
    },
    contentOffset: {
      diff: require('../../Utilities/differ/pointsDiffer')
    },
    contentInsetAdjustmentBehavior: true,
    decelerationRate: true,
    directionalLockEnabled: true,
    disableIntervalMomentum: true,
    indicatorStyle: true,
    inverted: true,
    keyboardDismissMode: true,
    maintainVisibleContentPosition: true,
    maximumZoomScale: true,
    minimumZoomScale: true,
    pagingEnabled: true,
    pinchGestureEnabled: true,
    scrollEnabled: true,
    scrollEventThrottle: true,
    scrollIndicatorInsets: {
      diff: require('../../Utilities/differ/insetsDiffer')
    },
    scrollToOverflowEnabled: true,
    scrollsToTop: true,
    showsHorizontalScrollIndicator: true,
    showsVerticalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToOffsets: true,
    snapToStart: true,
    zoomScale: true
  }, (0, _ViewConfigIgnore.ConditionallyIgnoredEventHandlers)({
    onScrollBeginDrag: true,
    onMomentumScrollEnd: true,
    onScrollEndDrag: true,
    onMomentumScrollBegin: true,
    onScrollToTop: true,
    onScroll: true
  }))
};
exports.__INTERNAL_VIEW_CONFIG = __INTERNAL_VIEW_CONFIG;
var ScrollViewNativeComponent = NativeComponentRegistry.get('RCTScrollView', function () {
  return __INTERNAL_VIEW_CONFIG;
});
var _default = ScrollViewNativeComponent;
exports.default = _default;
//# sourceMappingURL=ScrollViewNativeComponent.js.map