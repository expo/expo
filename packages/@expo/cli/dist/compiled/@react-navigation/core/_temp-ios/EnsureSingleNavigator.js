Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SingleNavigatorContext = void 0;
exports.default = EnsureSingleNavigator;
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var MULTIPLE_NAVIGATOR_ERROR = `Another navigator is already registered for this container. You likely have multiple navigators under a single "NavigationContainer" or "Screen". Make sure each navigator is under a separate "Screen" container. See https://reactnavigation.org/docs/nesting-navigators for a guide on nesting.`;
var SingleNavigatorContext = React.createContext(undefined);
exports.SingleNavigatorContext = SingleNavigatorContext;
function EnsureSingleNavigator(_ref) {
  var children = _ref.children;
  var navigatorKeyRef = React.useRef();
  var value = React.useMemo(function () {
    return {
      register: function register(key) {
        var currentKey = navigatorKeyRef.current;
        if (currentKey !== undefined && key !== currentKey) {
          throw new Error(MULTIPLE_NAVIGATOR_ERROR);
        }
        navigatorKeyRef.current = key;
      },
      unregister: function unregister(key) {
        var currentKey = navigatorKeyRef.current;
        if (key !== currentKey) {
          return;
        }
        navigatorKeyRef.current = undefined;
      }
    };
  }, []);
  return (0, _jsxRuntime.jsx)(SingleNavigatorContext.Provider, {
    value: value,
    children: children
  });
}