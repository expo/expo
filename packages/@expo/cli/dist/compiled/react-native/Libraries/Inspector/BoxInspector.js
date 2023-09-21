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
var resolveBoxStyle = require('./resolveBoxStyle');
var React = require('react');
var blank = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};
var BoxInspector = function (_React$Component) {
  (0, _inherits2.default)(BoxInspector, _React$Component);
  var _super = _createSuper(BoxInspector);
  function BoxInspector() {
    (0, _classCallCheck2.default)(this, BoxInspector);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(BoxInspector, [{
    key: "render",
    value: function render() {
      var frame = this.props.frame;
      var style = this.props.style;
      var margin = style && resolveBoxStyle('margin', style) || blank;
      var padding = style && resolveBoxStyle('padding', style) || blank;
      return (0, _jsxRuntime.jsx)(BoxContainer, {
        title: "margin",
        titleStyle: styles.marginLabel,
        box: margin,
        children: (0, _jsxRuntime.jsx)(BoxContainer, {
          title: "padding",
          box: padding,
          children: (0, _jsxRuntime.jsxs)(View, {
            children: [(0, _jsxRuntime.jsxs)(Text, {
              style: styles.innerText,
              children: ["(", (frame.left || 0).toFixed(1), ", ", (frame.top || 0).toFixed(1), ")"]
            }), (0, _jsxRuntime.jsxs)(Text, {
              style: styles.innerText,
              children: [(frame.width || 0).toFixed(1), " \xD7", ' ', (frame.height || 0).toFixed(1)]
            })]
          })
        })
      });
    }
  }]);
  return BoxInspector;
}(React.Component);
var BoxContainer = function (_React$Component2) {
  (0, _inherits2.default)(BoxContainer, _React$Component2);
  var _super2 = _createSuper(BoxContainer);
  function BoxContainer() {
    (0, _classCallCheck2.default)(this, BoxContainer);
    return _super2.apply(this, arguments);
  }
  (0, _createClass2.default)(BoxContainer, [{
    key: "render",
    value: function render() {
      var box = this.props.box;
      return (0, _jsxRuntime.jsxs)(View, {
        style: styles.box,
        children: [(0, _jsxRuntime.jsxs)(View, {
          style: styles.row,
          children: [(0, _jsxRuntime.jsx)(Text, {
            style: [this.props.titleStyle, styles.label],
            children: this.props.title
          }), (0, _jsxRuntime.jsx)(Text, {
            style: styles.boxText,
            children: box.top
          })]
        }), (0, _jsxRuntime.jsxs)(View, {
          style: styles.row,
          children: [(0, _jsxRuntime.jsx)(Text, {
            style: styles.boxText,
            children: box.left
          }), this.props.children, (0, _jsxRuntime.jsx)(Text, {
            style: styles.boxText,
            children: box.right
          })]
        }), (0, _jsxRuntime.jsx)(Text, {
          style: styles.boxText,
          children: box.bottom
        })]
      });
    }
  }]);
  return BoxContainer;
}(React.Component);
var styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  marginLabel: {
    width: 60
  },
  label: {
    fontSize: 10,
    color: 'rgb(255,100,0)',
    marginLeft: 5,
    flex: 1,
    textAlign: 'left',
    top: -3
  },
  innerText: {
    color: 'yellow',
    fontSize: 12,
    textAlign: 'center',
    width: 70
  },
  box: {
    borderWidth: 1,
    borderColor: 'grey'
  },
  boxText: {
    color: 'white',
    fontSize: 12,
    marginHorizontal: 3,
    marginVertical: 2,
    textAlign: 'center'
  }
});
module.exports = BoxInspector;