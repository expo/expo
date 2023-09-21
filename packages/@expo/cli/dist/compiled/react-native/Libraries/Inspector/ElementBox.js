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
var flattenStyle = require('../StyleSheet/flattenStyle');
var StyleSheet = require('../StyleSheet/StyleSheet');
var Dimensions = require('../Utilities/Dimensions').default;
var BorderBox = require('./BorderBox');
var resolveBoxStyle = require('./resolveBoxStyle');
var React = require('react');
var ElementBox = function (_React$Component) {
  (0, _inherits2.default)(ElementBox, _React$Component);
  var _super = _createSuper(ElementBox);
  function ElementBox() {
    (0, _classCallCheck2.default)(this, ElementBox);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(ElementBox, [{
    key: "render",
    value: function render() {
      var style = flattenStyle(this.props.style) || {};
      var margin = resolveBoxStyle('margin', style);
      var padding = resolveBoxStyle('padding', style);
      var frameStyle = Object.assign({}, this.props.frame);
      var contentStyle = {
        width: this.props.frame.width,
        height: this.props.frame.height
      };
      if (margin != null) {
        margin = resolveRelativeSizes(margin);
        frameStyle.top -= margin.top;
        frameStyle.left -= margin.left;
        frameStyle.height += margin.top + margin.bottom;
        frameStyle.width += margin.left + margin.right;
        if (margin.top < 0) {
          contentStyle.height += margin.top;
        }
        if (margin.bottom < 0) {
          contentStyle.height += margin.bottom;
        }
        if (margin.left < 0) {
          contentStyle.width += margin.left;
        }
        if (margin.right < 0) {
          contentStyle.width += margin.right;
        }
      }
      if (padding != null) {
        padding = resolveRelativeSizes(padding);
        contentStyle.width -= padding.left + padding.right;
        contentStyle.height -= padding.top + padding.bottom;
      }
      return (0, _jsxRuntime.jsx)(View, {
        style: [styles.frame, frameStyle],
        pointerEvents: "none",
        children: (0, _jsxRuntime.jsx)(BorderBox, {
          box: margin,
          style: styles.margin,
          children: (0, _jsxRuntime.jsx)(BorderBox, {
            box: padding,
            style: styles.padding,
            children: (0, _jsxRuntime.jsx)(View, {
              style: [styles.content, contentStyle]
            })
          })
        })
      });
    }
  }]);
  return ElementBox;
}(React.Component);
var styles = StyleSheet.create({
  frame: {
    position: 'absolute'
  },
  content: {
    backgroundColor: 'rgba(200, 230, 255, 0.8)'
  },
  padding: {
    borderColor: 'rgba(77, 255, 0, 0.3)'
  },
  margin: {
    borderColor: 'rgba(255, 132, 0, 0.3)'
  }
});
function resolveRelativeSizes(style) {
  var resolvedStyle = Object.assign({}, style);
  resolveSizeInPlace(resolvedStyle, 'top', 'height');
  resolveSizeInPlace(resolvedStyle, 'right', 'width');
  resolveSizeInPlace(resolvedStyle, 'bottom', 'height');
  resolveSizeInPlace(resolvedStyle, 'left', 'width');
  return resolvedStyle;
}
function resolveSizeInPlace(style, direction, dimension) {
  if (style[direction] !== null && typeof style[direction] === 'string') {
    if (style[direction].indexOf('%') !== -1) {
      style[direction] = parseFloat(style[direction]) / 100.0 * Dimensions.get('window')[dimension];
    }
    if (style[direction] === 'auto') {
      style[direction] = 0;
    }
  }
}
module.exports = ElementBox;