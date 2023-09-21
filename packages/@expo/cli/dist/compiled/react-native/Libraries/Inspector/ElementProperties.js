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
var TouchableHighlight = require('../Components/Touchable/TouchableHighlight');
var TouchableWithoutFeedback = require('../Components/Touchable/TouchableWithoutFeedback');
var View = require('../Components/View/View');
var openFileInEditor = require('../Core/Devtools/openFileInEditor');
var flattenStyle = require('../StyleSheet/flattenStyle');
var StyleSheet = require('../StyleSheet/StyleSheet');
var Text = require('../Text/Text');
var mapWithSeparator = require('../Utilities/mapWithSeparator');
var BoxInspector = require('./BoxInspector');
var StyleInspector = require('./StyleInspector');
var React = require('react');
var ElementProperties = function (_React$Component) {
  (0, _inherits2.default)(ElementProperties, _React$Component);
  var _super = _createSuper(ElementProperties);
  function ElementProperties() {
    (0, _classCallCheck2.default)(this, ElementProperties);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(ElementProperties, [{
    key: "render",
    value: function render() {
      var _this = this;
      var style = flattenStyle(this.props.style);
      var selection = this.props.selection;
      var openFileButton;
      var source = this.props.source;
      var _ref = source || {},
        fileName = _ref.fileName,
        lineNumber = _ref.lineNumber;
      if (fileName && lineNumber) {
        var parts = fileName.split('/');
        var fileNameShort = parts[parts.length - 1];
        openFileButton = (0, _jsxRuntime.jsx)(TouchableHighlight, {
          style: styles.openButton,
          onPress: openFileInEditor.bind(null, fileName, lineNumber),
          children: (0, _jsxRuntime.jsxs)(Text, {
            style: styles.openButtonTitle,
            numberOfLines: 1,
            children: [fileNameShort, ":", lineNumber]
          })
        });
      }
      return (0, _jsxRuntime.jsx)(TouchableWithoutFeedback, {
        children: (0, _jsxRuntime.jsxs)(View, {
          style: styles.info,
          children: [(0, _jsxRuntime.jsx)(View, {
            style: styles.breadcrumb,
            children: mapWithSeparator(this.props.hierarchy, function (hierarchyItem, i) {
              return (0, _jsxRuntime.jsx)(TouchableHighlight, {
                style: [styles.breadItem, i === selection && styles.selected],
                onPress: function onPress() {
                  return _this.props.setSelection(i);
                },
                children: (0, _jsxRuntime.jsx)(Text, {
                  style: styles.breadItemText,
                  children: hierarchyItem.name
                })
              }, 'item-' + i);
            }, function (i) {
              return (0, _jsxRuntime.jsx)(Text, {
                style: styles.breadSep,
                children: "\u25B8"
              }, 'sep-' + i);
            })
          }), (0, _jsxRuntime.jsxs)(View, {
            style: styles.row,
            children: [(0, _jsxRuntime.jsxs)(View, {
              style: styles.col,
              children: [(0, _jsxRuntime.jsx)(StyleInspector, {
                style: style
              }), openFileButton]
            }), (0, _jsxRuntime.jsx)(BoxInspector, {
              style: style,
              frame: this.props.frame
            })]
          })]
        })
      });
    }
  }]);
  return ElementProperties;
}(React.Component);
var styles = StyleSheet.create({
  breadSep: {
    fontSize: 8,
    color: 'white'
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 5
  },
  selected: {
    borderColor: 'white',
    borderRadius: 5
  },
  breadItem: {
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2
  },
  breadItemText: {
    fontSize: 10,
    color: 'white',
    marginHorizontal: 5
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  col: {
    flex: 1
  },
  info: {
    padding: 10
  },
  openButton: {
    padding: 10,
    backgroundColor: '#000',
    marginVertical: 5,
    marginRight: 5,
    borderRadius: 2
  },
  openButtonTitle: {
    color: 'white',
    fontSize: 8
  }
});
module.exports = ElementProperties;