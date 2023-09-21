Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualizedListCellContextProvider = VirtualizedListCellContextProvider;
exports.VirtualizedListContext = void 0;
exports.VirtualizedListContextProvider = VirtualizedListContextProvider;
exports.VirtualizedListContextResetter = VirtualizedListContextResetter;
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var VirtualizedListContext = React.createContext(null);
exports.VirtualizedListContext = VirtualizedListContext;
if (__DEV__) {
  VirtualizedListContext.displayName = 'VirtualizedListContext';
}
function VirtualizedListContextResetter(_ref) {
  var children = _ref.children;
  return (0, _jsxRuntime.jsx)(VirtualizedListContext.Provider, {
    value: null,
    children: children
  });
}
function VirtualizedListContextProvider(_ref2) {
  var children = _ref2.children,
    value = _ref2.value;
  var context = (0, React.useMemo)(function () {
    return {
      cellKey: null,
      getScrollMetrics: value.getScrollMetrics,
      horizontal: value.horizontal,
      getOutermostParentListRef: value.getOutermostParentListRef,
      registerAsNestedChild: value.registerAsNestedChild,
      unregisterAsNestedChild: value.unregisterAsNestedChild
    };
  }, [value.getScrollMetrics, value.horizontal, value.getOutermostParentListRef, value.registerAsNestedChild, value.unregisterAsNestedChild]);
  return (0, _jsxRuntime.jsx)(VirtualizedListContext.Provider, {
    value: context,
    children: children
  });
}
function VirtualizedListCellContextProvider(_ref3) {
  var cellKey = _ref3.cellKey,
    children = _ref3.children;
  var currContext = (0, React.useContext)(VirtualizedListContext);
  var context = (0, React.useMemo)(function () {
    return currContext == null ? null : Object.assign({}, currContext, {
      cellKey: cellKey
    });
  }, [currContext, cellKey]);
  return (0, _jsxRuntime.jsx)(VirtualizedListContext.Provider, {
    value: context,
    children: children
  });
}