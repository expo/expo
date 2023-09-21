var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _ProgressBarAndroidNativeComponent = _interopRequireDefault(require("./ProgressBarAndroidNativeComponent"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["styleAttr", "indeterminate", "animating"];
var React = require('react');
var ProgressBarAndroid = function ProgressBarAndroid(_ref, forwardedRef) {
  var _ref$styleAttr = _ref.styleAttr,
    styleAttr = _ref$styleAttr === void 0 ? 'Normal' : _ref$styleAttr,
    _ref$indeterminate = _ref.indeterminate,
    indeterminate = _ref$indeterminate === void 0 ? true : _ref$indeterminate,
    _ref$animating = _ref.animating,
    animating = _ref$animating === void 0 ? true : _ref$animating,
    restProps = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  return (0, _jsxRuntime.jsx)(_ProgressBarAndroidNativeComponent.default, Object.assign({
    styleAttr: styleAttr,
    indeterminate: indeterminate,
    animating: animating
  }, restProps, {
    ref: forwardedRef
  }));
};
var ProgressBarAndroidToExport = React.forwardRef(ProgressBarAndroid);
module.exports = ProgressBarAndroidToExport;