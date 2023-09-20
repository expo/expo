var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TraceUpdateOverlay;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _UIManager = _interopRequireDefault(require("../../ReactNative/UIManager"));
var _processColor = _interopRequireDefault(require("../../StyleSheet/processColor"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _View = _interopRequireDefault(require("../View/View"));
var _TraceUpdateOverlayNativeComponent = _interopRequireWildcard(require("./TraceUpdateOverlayNativeComponent"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var useEffect = React.useEffect,
  useRef = React.useRef,
  useState = React.useState;
var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
var isNativeComponentReady = _Platform.default.OS === 'android' && _UIManager.default.hasViewManagerConfig('TraceUpdateOverlay');
var devToolsAgent;
function TraceUpdateOverlay() {
  var _useState = useState(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    overlayDisabled = _useState2[0],
    setOverlayDisabled = _useState2[1];
  useEffect(function () {
    if (!isNativeComponentReady) {
      return;
    }
    function attachToDevtools(agent) {
      devToolsAgent = agent;
      agent.addListener('drawTraceUpdates', onAgentDrawTraceUpdates);
      agent.addListener('disableTraceUpdates', onAgentDisableTraceUpdates);
    }
    function subscribe() {
      hook == null ? void 0 : hook.on('react-devtools', attachToDevtools);
      if (hook != null && hook.reactDevtoolsAgent) {
        attachToDevtools(hook.reactDevtoolsAgent);
      }
    }
    function unsubscribe() {
      hook == null ? void 0 : hook.off('react-devtools', attachToDevtools);
      var agent = devToolsAgent;
      if (agent != null) {
        agent.removeListener('drawTraceUpdates', onAgentDrawTraceUpdates);
        agent.removeListener('disableTraceUpdates', onAgentDisableTraceUpdates);
        devToolsAgent = null;
      }
    }
    function onAgentDrawTraceUpdates() {
      var nodesToDraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      setOverlayDisabled(false);
      var newFramesToDraw = [];
      nodesToDraw.forEach(function (_ref) {
        var _ref2, _node$publicInstance;
        var node = _ref.node,
          color = _ref.color;
        var component = (_ref2 = (_node$publicInstance = node.publicInstance) != null ? _node$publicInstance : node.canonical) != null ? _ref2 : node;
        if (!component || !component.measure) {
          return;
        }
        var frameToDrawPromise = new Promise(function (resolve) {
          if (component.measure) {
            component.measure(function (x, y, width, height, left, top) {
              resolve({
                rect: {
                  left: left,
                  top: top,
                  width: width,
                  height: height
                },
                color: (0, _processColor.default)(color)
              });
            });
          }
        });
        newFramesToDraw.push(frameToDrawPromise);
      });
      Promise.all(newFramesToDraw).then(function (results) {
        if (nativeComponentRef.current != null) {
          _TraceUpdateOverlayNativeComponent.Commands.draw(nativeComponentRef.current, JSON.stringify(results.filter(function (_ref3) {
            var rect = _ref3.rect,
              color = _ref3.color;
            return rect.width >= 0 && rect.height >= 0;
          })));
        }
      }, function (err) {
        console.error(`Failed to measure updated traces. Error: ${err}`);
      });
    }
    function onAgentDisableTraceUpdates() {
      setOverlayDisabled(true);
    }
    subscribe();
    return unsubscribe;
  }, []);
  var nativeComponentRef = useRef(null);
  return !overlayDisabled && isNativeComponentReady && (0, _jsxRuntime.jsx)(_View.default, {
    pointerEvents: "none",
    style: styles.overlay,
    children: (0, _jsxRuntime.jsx)(_TraceUpdateOverlayNativeComponent.default, {
      ref: nativeComponentRef,
      style: styles.overlay
    })
  });
}
var styles = _StyleSheet.default.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
});
//# sourceMappingURL=TraceUpdateOverlay.js.map