'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _SafeAreaView = _interopRequireDefault(require("../Components/SafeAreaView/SafeAreaView"));
var _jsxRuntime = require("react/jsx-runtime");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ScrollView = require("../Components/ScrollView/ScrollView");
var TouchableHighlight = require("../Components/Touchable/TouchableHighlight");
var View = require("../Components/View/View");
var StyleSheet = require("../StyleSheet/StyleSheet");
var Text = require("../Text/Text");
var ElementProperties = require("./ElementProperties");
var NetworkOverlay = require("./NetworkOverlay");
var PerformanceOverlay = require("./PerformanceOverlay");
var React = require('react');
var InspectorPanel = function (_React$Component) {
  (0, _inherits2.default)(InspectorPanel, _React$Component);
  var _super = _createSuper(InspectorPanel);
  function InspectorPanel() {
    (0, _classCallCheck2.default)(this, InspectorPanel);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(InspectorPanel, [{
    key: "renderWaiting",
    value: function renderWaiting() {
      if (this.props.inspecting) {
        return (0, _jsxRuntime.jsx)(Text, {
          style: styles.waitingText,
          children: "Tap something to inspect it"
        });
      }
      return (0, _jsxRuntime.jsx)(Text, {
        style: styles.waitingText,
        children: "Nothing is inspected"
      });
    }
  }, {
    key: "render",
    value: function render() {
      var contents;
      if (this.props.inspected) {
        contents = (0, _jsxRuntime.jsx)(ScrollView, {
          style: styles.properties,
          children: (0, _jsxRuntime.jsx)(ElementProperties, {
            style: this.props.inspected.style,
            frame: this.props.inspected.frame,
            source: this.props.inspected.source,
            hierarchy: this.props.hierarchy,
            selection: this.props.selection,
            setSelection: this.props.setSelection
          })
        });
      } else if (this.props.perfing) {
        contents = (0, _jsxRuntime.jsx)(PerformanceOverlay, {});
      } else if (this.props.networking) {
        contents = (0, _jsxRuntime.jsx)(NetworkOverlay, {});
      } else {
        contents = (0, _jsxRuntime.jsx)(View, {
          style: styles.waiting,
          children: this.renderWaiting()
        });
      }
      return (0, _jsxRuntime.jsxs)(_SafeAreaView.default, {
        style: styles.container,
        children: [!this.props.devtoolsIsOpen && contents, (0, _jsxRuntime.jsxs)(View, {
          style: styles.buttonRow,
          children: [(0, _jsxRuntime.jsx)(InspectorPanelButton, {
            title: 'Inspect',
            pressed: this.props.inspecting,
            onClick: this.props.setInspecting
          }), (0, _jsxRuntime.jsx)(InspectorPanelButton, {
            title: 'Perf',
            pressed: this.props.perfing,
            onClick: this.props.setPerfing
          }), (0, _jsxRuntime.jsx)(InspectorPanelButton, {
            title: 'Network',
            pressed: this.props.networking,
            onClick: this.props.setNetworking
          }), (0, _jsxRuntime.jsx)(InspectorPanelButton, {
            title: 'Touchables',
            pressed: this.props.touchTargeting,
            onClick: this.props.setTouchTargeting
          })]
        })]
      });
    }
  }]);
  return InspectorPanel;
}(React.Component);
var InspectorPanelButton = function (_React$Component2) {
  (0, _inherits2.default)(InspectorPanelButton, _React$Component2);
  var _super2 = _createSuper(InspectorPanelButton);
  function InspectorPanelButton() {
    (0, _classCallCheck2.default)(this, InspectorPanelButton);
    return _super2.apply(this, arguments);
  }
  (0, _createClass2.default)(InspectorPanelButton, [{
    key: "render",
    value: function render() {
      var _this = this;
      return (0, _jsxRuntime.jsx)(TouchableHighlight, {
        onPress: function onPress() {
          return _this.props.onClick(!_this.props.pressed);
        },
        style: [styles.button, this.props.pressed && styles.buttonPressed],
        children: (0, _jsxRuntime.jsx)(Text, {
          style: styles.buttonText,
          children: this.props.title
        })
      });
    }
  }]);
  return InspectorPanelButton;
}(React.Component);
var styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row'
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    margin: 2,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    margin: 5
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  properties: {
    height: 200
  },
  waiting: {
    height: 100
  },
  waitingText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
    color: 'white'
  }
});
module.exports = InspectorPanel;
//# sourceMappingURL=InspectorPanel.js.map