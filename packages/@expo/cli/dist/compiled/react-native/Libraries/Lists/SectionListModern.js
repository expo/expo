'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _virtualizedLists = require("@react-native/virtualized-lists");
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var SectionList = (0, _react.forwardRef)(function (props, ref) {
  var propsWithDefaults = Object.assign({
    stickySectionHeadersEnabled: _Platform.default.OS === 'ios'
  }, props);
  var wrapperRef = (0, _react.useRef)();
  (0, _react.useImperativeHandle)(ref, function () {
    return {
      scrollToLocation: function scrollToLocation(params) {
        var _wrapperRef$current;
        (_wrapperRef$current = wrapperRef.current) == null ? void 0 : _wrapperRef$current.scrollToLocation(params);
      },
      recordInteraction: function recordInteraction() {
        var _wrapperRef$current2, _wrapperRef$current2$;
        (_wrapperRef$current2 = wrapperRef.current) == null ? void 0 : (_wrapperRef$current2$ = _wrapperRef$current2.getListRef()) == null ? void 0 : _wrapperRef$current2$.recordInteraction();
      },
      flashScrollIndicators: function flashScrollIndicators() {
        var _wrapperRef$current3, _wrapperRef$current3$;
        (_wrapperRef$current3 = wrapperRef.current) == null ? void 0 : (_wrapperRef$current3$ = _wrapperRef$current3.getListRef()) == null ? void 0 : _wrapperRef$current3$.flashScrollIndicators();
      },
      getScrollResponder: function getScrollResponder() {
        var _wrapperRef$current4, _wrapperRef$current4$;
        (_wrapperRef$current4 = wrapperRef.current) == null ? void 0 : (_wrapperRef$current4$ = _wrapperRef$current4.getListRef()) == null ? void 0 : _wrapperRef$current4$.getScrollResponder();
      },
      getScrollableNode: function getScrollableNode() {
        var _wrapperRef$current5, _wrapperRef$current5$;
        (_wrapperRef$current5 = wrapperRef.current) == null ? void 0 : (_wrapperRef$current5$ = _wrapperRef$current5.getListRef()) == null ? void 0 : _wrapperRef$current5$.getScrollableNode();
      },
      setNativeProps: function setNativeProps(nativeProps) {
        var _wrapperRef$current6, _wrapperRef$current6$;
        (_wrapperRef$current6 = wrapperRef.current) == null ? void 0 : (_wrapperRef$current6$ = _wrapperRef$current6.getListRef()) == null ? void 0 : _wrapperRef$current6$.setNativeProps(nativeProps);
      }
    };
  }, [wrapperRef]);
  return (0, _jsxRuntime.jsx)(_virtualizedLists.VirtualizedSectionList, Object.assign({}, propsWithDefaults, {
    ref: wrapperRef,
    getItemCount: function getItemCount(items) {
      return items.length;
    },
    getItem: function getItem(items, index) {
      return items[index];
    }
  }));
});
var _default = SectionList;
exports.default = _default;
//# sourceMappingURL=SectionListModern.js.map