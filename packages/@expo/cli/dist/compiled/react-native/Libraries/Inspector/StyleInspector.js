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
var Text = require("../Text/Text");
var React = require('react');
var StyleInspector = function (_React$Component) {
  (0, _inherits2.default)(StyleInspector, _React$Component);
  var _super = _createSuper(StyleInspector);
  function StyleInspector() {
    (0, _classCallCheck2.default)(this, StyleInspector);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(StyleInspector, [{
    key: "render",
    value: function render() {
      var _this = this;
      if (!this.props.style) {
        return (0, _jsxRuntime.jsx)(Text, {
          style: styles.noStyle,
          children: "No style"
        });
      }
      var names = Object.keys(this.props.style);
      return (0, _jsxRuntime.jsxs)(View, {
        style: styles.container,
        children: [(0, _jsxRuntime.jsx)(View, {
          children: names.map(function (name) {
            return (0, _jsxRuntime.jsxs)(Text, {
              style: styles.attr,
              children: [name, ":"]
            }, name);
          })
        }), (0, _jsxRuntime.jsx)(View, {
          children: names.map(function (name) {
            var value = _this.props.style[name];
            return (0, _jsxRuntime.jsx)(Text, {
              style: styles.value,
              children: typeof value !== 'string' && typeof value !== 'number' ? JSON.stringify(value) : value
            }, name);
          })
        })]
      });
    }
  }]);
  return StyleInspector;
}(React.Component);
var styles = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },
  attr: {
    fontSize: 10,
    color: '#ccc'
  },
  value: {
    fontSize: 10,
    color: 'white',
    marginLeft: 10
  },
  noStyle: {
    color: 'white',
    fontSize: 10
  }
});
module.exports = StyleInspector;
//# sourceMappingURL=StyleInspector.js.map