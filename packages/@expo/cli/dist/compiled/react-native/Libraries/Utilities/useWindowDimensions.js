var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useWindowDimensions;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _Dimensions = _interopRequireDefault(require("./Dimensions"));
var _react = require("react");
function useWindowDimensions() {
  var _useState = (0, _react.useState)(function () {
      return _Dimensions.default.get('window');
    }),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    dimensions = _useState2[0],
    setDimensions = _useState2[1];
  (0, _react.useEffect)(function () {
    function handleChange(_ref) {
      var window = _ref.window;
      if (dimensions.width !== window.width || dimensions.height !== window.height || dimensions.scale !== window.scale || dimensions.fontScale !== window.fontScale) {
        setDimensions(window);
      }
    }
    var subscription = _Dimensions.default.addEventListener('change', handleChange);
    handleChange({
      window: _Dimensions.default.get('window')
    });
    return function () {
      subscription.remove();
    };
  }, [dimensions]);
  return dimensions;
}
//# sourceMappingURL=useWindowDimensions.js.map