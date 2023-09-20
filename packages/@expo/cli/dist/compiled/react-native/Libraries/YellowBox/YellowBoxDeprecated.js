'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var LogBox = require("../LogBox/LogBox").default;
var React = require('react');
var YellowBox;
if (__DEV__) {
  YellowBox = function (_React$Component) {
    (0, _inherits2.default)(YellowBox, _React$Component);
    var _super = _createSuper(YellowBox);
    function YellowBox() {
      (0, _classCallCheck2.default)(this, YellowBox);
      return _super.apply(this, arguments);
    }
    (0, _createClass2.default)(YellowBox, [{
      key: "render",
      value: function render() {
        return null;
      }
    }], [{
      key: "ignoreWarnings",
      value: function ignoreWarnings(patterns) {
        console.warn('YellowBox has been replaced with LogBox. Please call LogBox.ignoreLogs() instead.');
        LogBox.ignoreLogs(patterns);
      }
    }, {
      key: "install",
      value: function install() {
        console.warn('YellowBox has been replaced with LogBox. Please call LogBox.install() instead.');
        LogBox.install();
      }
    }, {
      key: "uninstall",
      value: function uninstall() {
        console.warn('YellowBox has been replaced with LogBox. Please call LogBox.uninstall() instead.');
        LogBox.uninstall();
      }
    }]);
    return YellowBox;
  }(React.Component);
} else {
  YellowBox = function (_React$Component2) {
    (0, _inherits2.default)(YellowBox, _React$Component2);
    var _super2 = _createSuper(YellowBox);
    function YellowBox() {
      (0, _classCallCheck2.default)(this, YellowBox);
      return _super2.apply(this, arguments);
    }
    (0, _createClass2.default)(YellowBox, [{
      key: "render",
      value: function render() {
        return null;
      }
    }], [{
      key: "ignoreWarnings",
      value: function ignoreWarnings(patterns) {}
    }, {
      key: "install",
      value: function install() {}
    }, {
      key: "uninstall",
      value: function uninstall() {}
    }]);
    return YellowBox;
  }(React.Component);
}
module.exports = YellowBox;
//# sourceMappingURL=YellowBoxDeprecated.js.map