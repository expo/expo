var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CHILD_STATE = void 0;
exports.default = useRouteCache;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var React = _interopRequireWildcard(require("react"));
var _excluded = ["state"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var CHILD_STATE = Symbol('CHILD_STATE');
exports.CHILD_STATE = CHILD_STATE;
function useRouteCache(routes) {
  var cache = React.useMemo(function () {
    return {
      current: new Map()
    };
  }, []);
  if (process.env.NODE_ENV === 'production') {
    return routes;
  }
  cache.current = routes.reduce(function (acc, route) {
    var previous = cache.current.get(route);
    if (previous) {
      acc.set(route, previous);
    } else {
      var state = route.state,
        proxy = (0, _objectWithoutProperties2.default)(route, _excluded);
      Object.defineProperty(proxy, CHILD_STATE, {
        enumerable: false,
        value: state
      });
      acc.set(route, proxy);
    }
    return acc;
  }, new Map());
  return Array.from(cache.current.values());
}