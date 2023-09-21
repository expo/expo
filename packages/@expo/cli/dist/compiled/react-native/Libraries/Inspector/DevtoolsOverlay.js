var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DevtoolsOverlay;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _View = _interopRequireDefault(require("../Components/View/View"));
var _ReactNativeFeatureFlags = _interopRequireDefault(require("../ReactNative/ReactNativeFeatureFlags"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var _Dimensions = _interopRequireDefault(require("../Utilities/Dimensions"));
var _ElementBox = _interopRequireDefault(require("./ElementBox"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var _require = require('../ReactNative/RendererProxy'),
  findNodeHandle = _require.findNodeHandle;
var getInspectorDataForViewAtPoint = require('./getInspectorDataForViewAtPoint');
var useEffect = React.useEffect,
  useState = React.useState,
  useCallback = React.useCallback,
  useRef = React.useRef;
var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
function DevtoolsOverlay(_ref) {
  var inspectedView = _ref.inspectedView;
  var _useState = useState(null),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    inspected = _useState2[0],
    setInspected = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    isInspecting = _useState4[0],
    setIsInspecting = _useState4[1];
  var devToolsAgentRef = useRef(null);
  useEffect(function () {
    var devToolsAgent = null;
    var hideTimeoutId = null;
    function onAgentHideNativeHighlight() {
      clearTimeout(hideTimeoutId);
      hideTimeoutId = setTimeout(function () {
        setInspected(null);
      }, 100);
    }
    function onAgentShowNativeHighlight(node) {
      var _ref2, _node$publicInstance;
      clearTimeout(hideTimeoutId);
      var component = (_ref2 = (_node$publicInstance = node.publicInstance) != null ? _node$publicInstance : node.canonical) != null ? _ref2 : node;
      if (!component || !component.measure) {
        return;
      }
      component.measure(function (x, y, width, height, left, top) {
        setInspected({
          frame: {
            left: left,
            top: top,
            width: width,
            height: height
          }
        });
      });
    }
    function cleanup() {
      var currentAgent = devToolsAgent;
      if (currentAgent != null) {
        currentAgent.removeListener('hideNativeHighlight', onAgentHideNativeHighlight);
        currentAgent.removeListener('showNativeHighlight', onAgentShowNativeHighlight);
        currentAgent.removeListener('shutdown', cleanup);
        currentAgent.removeListener('startInspectingNative', onStartInspectingNative);
        currentAgent.removeListener('stopInspectingNative', onStopInspectingNative);
        devToolsAgent = null;
      }
      devToolsAgentRef.current = null;
    }
    function onStartInspectingNative() {
      setIsInspecting(true);
    }
    function onStopInspectingNative() {
      setIsInspecting(false);
    }
    function _attachToDevtools(agent) {
      devToolsAgent = agent;
      devToolsAgentRef.current = agent;
      agent.addListener('hideNativeHighlight', onAgentHideNativeHighlight);
      agent.addListener('showNativeHighlight', onAgentShowNativeHighlight);
      agent.addListener('shutdown', cleanup);
      agent.addListener('startInspectingNative', onStartInspectingNative);
      agent.addListener('stopInspectingNative', onStopInspectingNative);
    }
    hook.on('react-devtools', _attachToDevtools);
    if (hook.reactDevtoolsAgent) {
      _attachToDevtools(hook.reactDevtoolsAgent);
    }
    return function () {
      hook.off('react-devtools', _attachToDevtools);
      cleanup();
    };
  }, []);
  var findViewForLocation = useCallback(function (x, y) {
    var agent = devToolsAgentRef.current;
    if (agent == null) {
      return;
    }
    getInspectorDataForViewAtPoint(inspectedView, x, y, function (viewData) {
      var touchedViewTag = viewData.touchedViewTag,
        closestInstance = viewData.closestInstance,
        frame = viewData.frame;
      if (closestInstance != null || touchedViewTag != null) {
        agent.selectNode(findNodeHandle(touchedViewTag));
        if (closestInstance != null) {
          agent.selectNode(closestInstance);
        }
        setInspected({
          frame: frame
        });
        return true;
      }
      return false;
    });
  }, [inspectedView]);
  var stopInspecting = useCallback(function () {
    var agent = devToolsAgentRef.current;
    if (agent == null) {
      return;
    }
    agent.stopInspectingNative(true);
    setIsInspecting(false);
    setInspected(null);
  }, []);
  var onPointerMove = useCallback(function (e) {
    findViewForLocation(e.nativeEvent.x, e.nativeEvent.y);
  }, [findViewForLocation]);
  var onResponderMove = useCallback(function (e) {
    findViewForLocation(e.nativeEvent.touches[0].locationX, e.nativeEvent.touches[0].locationY);
  }, [findViewForLocation]);
  var shouldSetResponder = useCallback(function (e) {
    onResponderMove(e);
    return true;
  }, [onResponderMove]);
  var highlight = inspected ? (0, _jsxRuntime.jsx)(_ElementBox.default, {
    frame: inspected.frame
  }) : null;
  if (isInspecting) {
    var events = _ReactNativeFeatureFlags.default.shouldEmitW3CPointerEvents() ? {
      onPointerMove: onPointerMove,
      onPointerDown: onPointerMove,
      onPointerUp: stopInspecting
    } : {
      onStartShouldSetResponder: shouldSetResponder,
      onResponderMove: onResponderMove,
      onResponderRelease: stopInspecting
    };
    return (0, _jsxRuntime.jsx)(_View.default, Object.assign({
      nativeID: "devToolsInspectorOverlay",
      style: [styles.inspector, {
        height: _Dimensions.default.get('window').height
      }]
    }, events, {
      children: highlight
    }));
  }
  return highlight;
}
var styles = _StyleSheet.default.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0
  }
});