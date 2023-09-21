var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createAnimatedComponent;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _View = _interopRequireDefault(require("../Components/View/View"));
var _useMergeRefs = _interopRequireDefault(require("../Utilities/useMergeRefs"));
var _useAnimatedProps3 = _interopRequireDefault(require("./useAnimatedProps"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["style"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function createAnimatedComponent(Component) {
  return React.forwardRef(function (props, forwardedRef) {
    var _useAnimatedProps = (0, _useAnimatedProps3.default)(props),
      _useAnimatedProps2 = (0, _slicedToArray2.default)(_useAnimatedProps, 2),
      reducedProps = _useAnimatedProps2[0],
      callbackRef = _useAnimatedProps2[1];
    var ref = (0, _useMergeRefs.default)(callbackRef, forwardedRef);
    var passthroughAnimatedPropExplicitValues = reducedProps.passthroughAnimatedPropExplicitValues,
      style = reducedProps.style;
    var _ref = passthroughAnimatedPropExplicitValues != null ? passthroughAnimatedPropExplicitValues : {},
      passthroughStyle = _ref.style,
      passthroughProps = (0, _objectWithoutProperties2.default)(_ref, _excluded);
    var mergedStyle = Object.assign({}, style, passthroughStyle);
    return (0, _jsxRuntime.jsx)(Component, Object.assign({}, reducedProps, passthroughProps, {
      style: mergedStyle,
      ref: ref
    }));
  });
}