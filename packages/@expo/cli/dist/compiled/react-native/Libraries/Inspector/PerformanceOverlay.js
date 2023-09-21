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
var View = require('../Components/View/View');
var StyleSheet = require('../StyleSheet/StyleSheet');
var Text = require('../Text/Text');
var PerformanceLogger = require('../Utilities/GlobalPerformanceLogger');
var React = require('react');
var PerformanceOverlay = function (_React$Component) {
  (0, _inherits2.default)(PerformanceOverlay, _React$Component);
  var _super = _createSuper(PerformanceOverlay);
  function PerformanceOverlay() {
    (0, _classCallCheck2.default)(this, PerformanceOverlay);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(PerformanceOverlay, [{
    key: "render",
    value: function render() {
      var perfLogs = PerformanceLogger.getTimespans();
      var items = [];
      for (var key in perfLogs) {
        var _perfLogs$key;
        if ((_perfLogs$key = perfLogs[key]) != null && _perfLogs$key.totalTime) {
          var unit = key === 'BundleSize' ? 'b' : 'ms';
          items.push((0, _jsxRuntime.jsxs)(View, {
            style: styles.row,
            children: [(0, _jsxRuntime.jsx)(Text, {
              style: [styles.text, styles.label],
              children: key
            }), (0, _jsxRuntime.jsx)(Text, {
              style: [styles.text, styles.totalTime],
              children: perfLogs[key].totalTime + unit
            })]
          }, key));
        }
      }
      return (0, _jsxRuntime.jsx)(View, {
        style: styles.container,
        children: items
      });
    }
  }]);
  return PerformanceOverlay;
}(React.Component);
var styles = StyleSheet.create({
  container: {
    height: 100,
    paddingTop: 10
  },
  label: {
    flex: 1
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 10
  },
  text: {
    color: 'white',
    fontSize: 12
  },
  totalTime: {
    paddingRight: 100
  }
});
module.exports = PerformanceOverlay;