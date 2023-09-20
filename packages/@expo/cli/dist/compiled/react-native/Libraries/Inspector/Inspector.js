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
var ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');
var View = require('../Components/View/View');
var PressabilityDebug = require('../Pressability/PressabilityDebug');
var _require = require('../ReactNative/RendererProxy'),
  findNodeHandle = _require.findNodeHandle;
var StyleSheet = require('../StyleSheet/StyleSheet');
var Dimensions = require('../Utilities/Dimensions').default;
var Platform = require('../Utilities/Platform');
var getInspectorDataForViewAtPoint = require('./getInspectorDataForViewAtPoint');
var InspectorOverlay = require('./InspectorOverlay');
var InspectorPanel = require('./InspectorPanel');
var React = require('react');
var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
hook.resolveRNStyle = require('../StyleSheet/flattenStyle');
hook.nativeStyleEditorValidAttributes = Object.keys(ReactNativeStyleAttributes);
var Inspector = function (_React$Component) {
  (0, _inherits2.default)(Inspector, _React$Component);
  var _super = _createSuper(Inspector);
  function Inspector(props) {
    var _this;
    (0, _classCallCheck2.default)(this, Inspector);
    _this = _super.call(this, props);
    _this._hideTimeoutID = null;
    _this._attachToDevtools = function (agent) {
      agent.addListener('shutdown', _this._onAgentShutdown);
      _this.setState({
        devtoolsAgent: agent
      });
    };
    _this._onAgentShutdown = function () {
      var agent = _this.state.devtoolsAgent;
      if (agent != null) {
        agent.removeListener('shutdown', _this._onAgentShutdown);
        _this.setState({
          devtoolsAgent: null
        });
      }
    };
    _this.state = {
      devtoolsAgent: null,
      hierarchy: null,
      panelPos: 'bottom',
      inspecting: true,
      perfing: false,
      inspected: null,
      selection: null,
      inspectedView: _this.props.inspectedView,
      networking: false
    };
    return _this;
  }
  (0, _createClass2.default)(Inspector, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      hook.on('react-devtools', this._attachToDevtools);
      if (hook.reactDevtoolsAgent) {
        this._attachToDevtools(hook.reactDevtoolsAgent);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this._subs) {
        this._subs.map(function (fn) {
          return fn();
        });
      }
      hook.off('react-devtools', this._attachToDevtools);
      this._setTouchedViewData = null;
    }
  }, {
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(newProps) {
      this.setState({
        inspectedView: newProps.inspectedView
      });
    }
  }, {
    key: "setSelection",
    value: function setSelection(i) {
      var _this2 = this;
      var hierarchyItem = this.state.hierarchy[i];
      var _hierarchyItem$getIns = hierarchyItem.getInspectorData(findNodeHandle),
        measure = _hierarchyItem$getIns.measure,
        props = _hierarchyItem$getIns.props,
        source = _hierarchyItem$getIns.source;
      measure(function (x, y, width, height, left, top) {
        _this2.setState({
          inspected: {
            frame: {
              left: left,
              top: top,
              width: width,
              height: height
            },
            style: props.style,
            source: source
          },
          selection: i
        });
      });
    }
  }, {
    key: "onTouchPoint",
    value: function onTouchPoint(locationX, locationY) {
      var _this3 = this;
      this._setTouchedViewData = function (viewData) {
        var hierarchy = viewData.hierarchy,
          props = viewData.props,
          selectedIndex = viewData.selectedIndex,
          source = viewData.source,
          frame = viewData.frame,
          pointerY = viewData.pointerY,
          touchedViewTag = viewData.touchedViewTag,
          closestInstance = viewData.closestInstance;
        var agent = _this3.state.devtoolsAgent;
        if (agent) {
          agent.selectNode(findNodeHandle(touchedViewTag));
          if (closestInstance != null) {
            agent.selectNode(closestInstance);
          }
        }
        _this3.setState({
          panelPos: pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
          selection: selectedIndex,
          hierarchy: hierarchy,
          inspected: {
            style: props.style,
            frame: frame,
            source: source
          }
        });
      };
      getInspectorDataForViewAtPoint(this.state.inspectedView, locationX, locationY, function (viewData) {
        if (_this3._setTouchedViewData != null) {
          _this3._setTouchedViewData(viewData);
          _this3._setTouchedViewData = null;
        }
        return false;
      });
    }
  }, {
    key: "setPerfing",
    value: function setPerfing(val) {
      this.setState({
        perfing: val,
        inspecting: false,
        inspected: null,
        networking: false
      });
    }
  }, {
    key: "setInspecting",
    value: function setInspecting(val) {
      this.setState({
        inspecting: val,
        inspected: null
      });
    }
  }, {
    key: "setTouchTargeting",
    value: function setTouchTargeting(val) {
      var _this4 = this;
      PressabilityDebug.setEnabled(val);
      this.props.onRequestRerenderApp(function (inspectedView) {
        _this4.setState({
          inspectedView: inspectedView
        });
      });
    }
  }, {
    key: "setNetworking",
    value: function setNetworking(val) {
      this.setState({
        networking: val,
        perfing: false,
        inspecting: false,
        inspected: null
      });
    }
  }, {
    key: "render",
    value: function render() {
      var panelContainerStyle = this.state.panelPos === 'bottom' ? {
        bottom: 0
      } : {
        top: Platform.OS === 'ios' ? 20 : 0
      };
      return (0, _jsxRuntime.jsxs)(View, {
        style: styles.container,
        pointerEvents: "box-none",
        children: [this.state.inspecting && (0, _jsxRuntime.jsx)(InspectorOverlay, {
          inspected: this.state.inspected,
          onTouchPoint: this.onTouchPoint.bind(this)
        }), (0, _jsxRuntime.jsx)(View, {
          style: [styles.panelContainer, panelContainerStyle],
          children: (0, _jsxRuntime.jsx)(InspectorPanel, {
            devtoolsIsOpen: !!this.state.devtoolsAgent,
            inspecting: this.state.inspecting,
            perfing: this.state.perfing,
            setPerfing: this.setPerfing.bind(this),
            setInspecting: this.setInspecting.bind(this),
            inspected: this.state.inspected,
            hierarchy: this.state.hierarchy,
            selection: this.state.selection,
            setSelection: this.setSelection.bind(this),
            touchTargeting: PressabilityDebug.isEnabled(),
            setTouchTargeting: this.setTouchTargeting.bind(this),
            networking: this.state.networking,
            setNetworking: this.setNetworking.bind(this)
          })
        })]
      });
    }
  }]);
  return Inspector;
}(React.Component);
var styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  panelContainer: {
    position: 'absolute',
    left: 0,
    right: 0
  }
});
module.exports = Inspector;
//# sourceMappingURL=Inspector.js.map