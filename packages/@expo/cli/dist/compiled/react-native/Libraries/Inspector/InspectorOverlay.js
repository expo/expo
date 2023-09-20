'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _jsxRuntime = require("react/jsx-runtime");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var View = require("../Components/View/View");
var StyleSheet = require("../StyleSheet/StyleSheet");
var Dimensions = require("../Utilities/Dimensions").default;
var ElementBox = require("./ElementBox");
var React = require('react');
var InspectorOverlay = function (_React$Component) {
  (0, _inherits2.default)(InspectorOverlay, _React$Component);
  var _super = _createSuper(InspectorOverlay);
  function InspectorOverlay() {
    var _this;
    (0, _classCallCheck2.default)(this, InspectorOverlay);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.findViewForTouchEvent = function (e) {
      var _e$nativeEvent$touche = e.nativeEvent.touches[0],
        locationX = _e$nativeEvent$touche.locationX,
        locationY = _e$nativeEvent$touche.locationY;
      _this.props.onTouchPoint(locationX, locationY);
    };
    _this.shouldSetResponder = function (e) {
      _this.findViewForTouchEvent(e);
      return true;
    };
    return _this;
  }
  (0, _createClass2.default)(InspectorOverlay, [{
    key: "render",
    value: function render() {
      var content = null;
      if (this.props.inspected) {
        content = (0, _jsxRuntime.jsx)(ElementBox, {
          frame: this.props.inspected.frame,
          style: this.props.inspected.style
        });
      }
      return (0, _jsxRuntime.jsx)(View, {
        onStartShouldSetResponder: this.shouldSetResponder,
        onResponderMove: this.findViewForTouchEvent,
        nativeID: "inspectorOverlay",
        style: [styles.inspector, {
          height: Dimensions.get('window').height
        }],
        children: content
      });
    }
  }]);
  return InspectorOverlay;
}(React.Component);
var styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0
  }
});
module.exports = InspectorOverlay;
//# sourceMappingURL=InspectorOverlay.js.map