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
var React = require('react');
var BorderBox = function (_React$Component) {
  (0, _inherits2.default)(BorderBox, _React$Component);
  var _super = _createSuper(BorderBox);
  function BorderBox() {
    (0, _classCallCheck2.default)(this, BorderBox);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(BorderBox, [{
    key: "render",
    value: function render() {
      var box = this.props.box;
      if (!box) {
        return this.props.children;
      }
      var style = {
        borderTopWidth: box.top,
        borderBottomWidth: box.bottom,
        borderLeftWidth: box.left,
        borderRightWidth: box.right
      };
      return (0, _jsxRuntime.jsx)(View, {
        style: [style, this.props.style],
        children: this.props.children
      });
    }
  }]);
  return BorderBox;
}(React.Component);
module.exports = BorderBox;
//# sourceMappingURL=BorderBox.js.map