/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 608:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.initialWindowSafeAreaInsets = exports.initialWindowMetrics = void 0;
var _NativeSafeAreaContext = _interopRequireDefault(__nccwpck_require__(967));
var _ref;
var _NativeSafeAreaContex, _NativeSafeAreaContex2;
var initialWindowMetrics = (_ref = _NativeSafeAreaContext.default === null || _NativeSafeAreaContext.default === void 0 ? void 0 : (_NativeSafeAreaContex = _NativeSafeAreaContext.default.getConstants) === null || _NativeSafeAreaContex === void 0 ? void 0 : (_NativeSafeAreaContex2 = _NativeSafeAreaContex.call(_NativeSafeAreaContext.default)) === null || _NativeSafeAreaContex2 === void 0 ? void 0 : _NativeSafeAreaContex2.initialWindowMetrics) != null ? _ref : null;
exports.initialWindowMetrics = initialWindowMetrics;
var initialWindowSafeAreaInsets = initialWindowMetrics === null || initialWindowMetrics === void 0 ? void 0 : initialWindowMetrics.insets;
exports.initialWindowSafeAreaInsets = initialWindowSafeAreaInsets;

/***/ }),

/***/ 482:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "NativeSafeAreaProvider", ({
  enumerable: true,
  get: function get() {
    return _NativeSafeAreaProvider.default;
  }
}));
var _NativeSafeAreaProvider = _interopRequireDefault(__nccwpck_require__(199));

/***/ }),

/***/ 821:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ 768:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.SafeAreaInsetsContext = exports.SafeAreaFrameContext = exports.SafeAreaContext = exports.SafeAreaConsumer = void 0;
exports.SafeAreaProvider = SafeAreaProvider;
exports.useSafeArea = useSafeArea;
exports.useSafeAreaFrame = useSafeAreaFrame;
exports.useSafeAreaInsets = useSafeAreaInsets;
exports.withSafeAreaInsets = withSafeAreaInsets;
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(250));
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(61));
var React = _interopRequireWildcard(__nccwpck_require__(522));
var _reactNative = __nccwpck_require__(853);
var _NativeSafeAreaProvider = __nccwpck_require__(482);
var _excluded = ["children", "initialMetrics", "initialSafeAreaInsets", "style"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var isDev = process.env.NODE_ENV !== 'production';
var SafeAreaInsetsContext = React.createContext(null);
exports.SafeAreaInsetsContext = SafeAreaInsetsContext;
if (isDev) {
  SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';
}
var SafeAreaFrameContext = React.createContext(null);
exports.SafeAreaFrameContext = SafeAreaFrameContext;
if (isDev) {
  SafeAreaFrameContext.displayName = 'SafeAreaFrameContext';
}
function SafeAreaProvider(_ref) {
  var _ref2, _ref3, _ref4, _ref5, _ref6;
  var children = _ref.children,
    initialMetrics = _ref.initialMetrics,
    initialSafeAreaInsets = _ref.initialSafeAreaInsets,
    style = _ref.style,
    others = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var parentInsets = useParentSafeAreaInsets();
  var parentFrame = useParentSafeAreaFrame();
  var _React$useState = React.useState((_ref2 = (_ref3 = (_ref4 = initialMetrics === null || initialMetrics === void 0 ? void 0 : initialMetrics.insets) != null ? _ref4 : initialSafeAreaInsets) != null ? _ref3 : parentInsets) != null ? _ref2 : null),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    insets = _React$useState2[0],
    setInsets = _React$useState2[1];
  var _React$useState3 = React.useState((_ref5 = (_ref6 = initialMetrics === null || initialMetrics === void 0 ? void 0 : initialMetrics.frame) != null ? _ref6 : parentFrame) != null ? _ref5 : {
      x: 0,
      y: 0,
      width: _reactNative.Dimensions.get('window').width,
      height: _reactNative.Dimensions.get('window').height
    }),
    _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
    frame = _React$useState4[0],
    setFrame = _React$useState4[1];
  var onInsetsChange = React.useCallback(function (event) {
    var _event$nativeEvent = event.nativeEvent,
      nextFrame = _event$nativeEvent.frame,
      nextInsets = _event$nativeEvent.insets;
    if (nextFrame && (nextFrame.height !== frame.height || nextFrame.width !== frame.width || nextFrame.x !== frame.x || nextFrame.y !== frame.y)) {
      setFrame(nextFrame);
    }
    if (!insets || nextInsets.bottom !== insets.bottom || nextInsets.left !== insets.left || nextInsets.right !== insets.right || nextInsets.top !== insets.top) {
      setInsets(nextInsets);
    }
  }, [frame, insets]);
  return React.createElement(_NativeSafeAreaProvider.NativeSafeAreaProvider, _extends({
    style: [styles.fill, style],
    onInsetsChange: onInsetsChange
  }, others), insets != null ? React.createElement(SafeAreaFrameContext.Provider, {
    value: frame
  }, React.createElement(SafeAreaInsetsContext.Provider, {
    value: insets
  }, children)) : null);
}
var styles = _reactNative.StyleSheet.create({
  fill: {
    flex: 1
  }
});
function useParentSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}
function useParentSafeAreaFrame() {
  return React.useContext(SafeAreaFrameContext);
}
var NO_INSETS_ERROR = 'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.';
function useSafeAreaInsets() {
  var insets = React.useContext(SafeAreaInsetsContext);
  if (insets == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return insets;
}
function useSafeAreaFrame() {
  var frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}
function withSafeAreaInsets(WrappedComponent) {
  return React.forwardRef(function (props, ref) {
    var insets = useSafeAreaInsets();
    return React.createElement(WrappedComponent, _extends({}, props, {
      insets: insets,
      ref: ref
    }));
  });
}
function useSafeArea() {
  return useSafeAreaInsets();
}
var SafeAreaConsumer = SafeAreaInsetsContext.Consumer;
exports.SafeAreaConsumer = SafeAreaConsumer;
var SafeAreaContext = SafeAreaInsetsContext;
exports.SafeAreaContext = SafeAreaContext;

/***/ }),

/***/ 244:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.SafeAreaView = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(61));
var React = _interopRequireWildcard(__nccwpck_require__(522));
var _NativeSafeAreaView = _interopRequireDefault(__nccwpck_require__(700));
var _excluded = ["edges"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var defaultEdges = {
  top: 'additive',
  left: 'additive',
  bottom: 'additive',
  right: 'additive'
};
var SafeAreaView = React.forwardRef(function (_ref, ref) {
  var edges = _ref.edges,
    props = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var nativeEdges = (0, React.useMemo)(function () {
    var _edgesObj$top, _edgesObj$right, _edgesObj$bottom, _edgesObj$left;
    if (edges == null) {
      return defaultEdges;
    }
    var edgesObj = Array.isArray(edges) ? edges.reduce(function (acc, edge) {
      acc[edge] = 'additive';
      return acc;
    }, {}) : edges;
    var requiredEdges = {
      top: (_edgesObj$top = edgesObj.top) != null ? _edgesObj$top : 'off',
      right: (_edgesObj$right = edgesObj.right) != null ? _edgesObj$right : 'off',
      bottom: (_edgesObj$bottom = edgesObj.bottom) != null ? _edgesObj$bottom : 'off',
      left: (_edgesObj$left = edgesObj.left) != null ? _edgesObj$left : 'off'
    };
    return requiredEdges;
  }, [edges]);
  return React.createElement(_NativeSafeAreaView.default, _extends({}, props, {
    edges: nativeEdges,
    ref: ref
  }));
});
exports.SafeAreaView = SafeAreaView;

/***/ }),

/***/ 584:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
var _SafeAreaContext = __nccwpck_require__(768);
Object.keys(_SafeAreaContext).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SafeAreaContext[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SafeAreaContext[key];
    }
  });
});
var _SafeAreaView = __nccwpck_require__(244);
Object.keys(_SafeAreaView).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SafeAreaView[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SafeAreaView[key];
    }
  });
});
var _InitialWindow = __nccwpck_require__(608);
Object.keys(_InitialWindow).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _InitialWindow[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _InitialWindow[key];
    }
  });
});
var _SafeArea = __nccwpck_require__(821);
Object.keys(_SafeArea).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _SafeArea[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _SafeArea[key];
    }
  });
});

/***/ }),

/***/ 967:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _reactNative = __nccwpck_require__(853);
var _default = _reactNative.TurboModuleRegistry.get('RNCSafeAreaContext');
exports["default"] = _default;

/***/ }),

/***/ 199:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _codegenNativeComponent = _interopRequireDefault(__nccwpck_require__(218));
var _default = (0, _codegenNativeComponent.default)('RNCSafeAreaProvider');
exports["default"] = _default;

/***/ }),

/***/ 700:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _codegenNativeComponent = _interopRequireDefault(__nccwpck_require__(218));
var _default = (0, _codegenNativeComponent.default)('RNCSafeAreaView', {
  interfaceOnly: true
});
exports["default"] = _default;

/***/ }),

/***/ 973:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/interopRequireDefault");

/***/ }),

/***/ 61:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/objectWithoutProperties");

/***/ }),

/***/ 250:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/slicedToArray");

/***/ }),

/***/ 853:
/***/ (function(module) {

"use strict";
module.exports = require("@expo/cli/dist/compiled/react-native");

/***/ }),

/***/ 218:
/***/ (function(module) {

"use strict";
module.exports = require("@expo/cli/dist/compiled/react-native/Libraries/Utilities/codegenNativeComponent");

/***/ }),

/***/ 522:
/***/ (function(module) {

"use strict";
module.exports = require("react");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = "" + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(584);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;