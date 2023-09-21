var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PreventRemoveProvider;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _nonSecure = require("nanoid/non-secure");
var React = _interopRequireWildcard(require("react"));
var _useLatestCallback = _interopRequireDefault(require("use-latest-callback"));
var _NavigationHelpersContext = _interopRequireDefault(require("./NavigationHelpersContext"));
var _NavigationRouteContext = _interopRequireDefault(require("./NavigationRouteContext"));
var _PreventRemoveContext = _interopRequireDefault(require("./PreventRemoveContext"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var transformPreventedRoutes = function transformPreventedRoutes(preventedRoutesMap) {
  var preventedRoutesToTransform = (0, _toConsumableArray2.default)(preventedRoutesMap.values());
  var preventedRoutes = preventedRoutesToTransform.reduce(function (acc, _ref) {
    var _acc$routeKey;
    var routeKey = _ref.routeKey,
      preventRemove = _ref.preventRemove;
    acc[routeKey] = {
      preventRemove: ((_acc$routeKey = acc[routeKey]) == null ? void 0 : _acc$routeKey.preventRemove) || preventRemove
    };
    return acc;
  }, {});
  return preventedRoutes;
};
function PreventRemoveProvider(_ref2) {
  var children = _ref2.children;
  var _React$useState = React.useState(function () {
      return (0, _nonSecure.nanoid)();
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
    parentId = _React$useState2[0];
  var _React$useState3 = React.useState(new Map()),
    _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
    preventedRoutesMap = _React$useState4[0],
    setPreventedRoutesMap = _React$useState4[1];
  var navigation = React.useContext(_NavigationHelpersContext.default);
  var route = React.useContext(_NavigationRouteContext.default);
  var preventRemoveContextValue = React.useContext(_PreventRemoveContext.default);
  var setParentPrevented = preventRemoveContextValue == null ? void 0 : preventRemoveContextValue.setPreventRemove;
  var setPreventRemove = (0, _useLatestCallback.default)(function (id, routeKey, preventRemove) {
    if (preventRemove && (navigation == null || navigation != null && navigation.getState().routes.every(function (route) {
      return route.key !== routeKey;
    }))) {
      throw new Error(`Couldn't find a route with the key ${routeKey}. Is your component inside NavigationContent?`);
    }
    setPreventedRoutesMap(function (prevPrevented) {
      var _prevPrevented$get, _prevPrevented$get2;
      if (routeKey === ((_prevPrevented$get = prevPrevented.get(id)) == null ? void 0 : _prevPrevented$get.routeKey) && preventRemove === ((_prevPrevented$get2 = prevPrevented.get(id)) == null ? void 0 : _prevPrevented$get2.preventRemove)) {
        return prevPrevented;
      }
      var nextPrevented = new Map(prevPrevented);
      if (preventRemove) {
        nextPrevented.set(id, {
          routeKey: routeKey,
          preventRemove: preventRemove
        });
      } else {
        nextPrevented.delete(id);
      }
      return nextPrevented;
    });
  });
  var isPrevented = (0, _toConsumableArray2.default)(preventedRoutesMap.values()).some(function (_ref3) {
    var preventRemove = _ref3.preventRemove;
    return preventRemove;
  });
  React.useEffect(function () {
    if ((route == null ? void 0 : route.key) !== undefined && setParentPrevented !== undefined) {
      setParentPrevented(parentId, route.key, isPrevented);
      return function () {
        setParentPrevented(parentId, route.key, false);
      };
    }
    return;
  }, [parentId, isPrevented, route == null ? void 0 : route.key, setParentPrevented]);
  var value = React.useMemo(function () {
    return {
      setPreventRemove: setPreventRemove,
      preventedRoutes: transformPreventedRoutes(preventedRoutesMap)
    };
  }, [setPreventRemove, preventedRoutesMap]);
  return (0, _jsxRuntime.jsx)(_PreventRemoveContext.default.Provider, {
    value: value,
    children: children
  });
}