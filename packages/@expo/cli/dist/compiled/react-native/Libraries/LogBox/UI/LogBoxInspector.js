var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _Keyboard = _interopRequireDefault(require("../../Components/Keyboard/Keyboard"));
var _ScrollView = _interopRequireDefault(require("../../Components/ScrollView/ScrollView"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var LogBoxData = _interopRequireWildcard(require("../Data/LogBoxData"));
var _LogBoxLog = _interopRequireDefault(require("../Data/LogBoxLog"));
var _LogBoxInspectorCodeFrame = _interopRequireDefault(require("./LogBoxInspectorCodeFrame"));
var _LogBoxInspectorFooter = _interopRequireDefault(require("./LogBoxInspectorFooter"));
var _LogBoxInspectorHeader = _interopRequireDefault(require("./LogBoxInspectorHeader"));
var _LogBoxInspectorMessageHeader = _interopRequireDefault(require("./LogBoxInspectorMessageHeader"));
var _LogBoxInspectorReactFrames = _interopRequireDefault(require("./LogBoxInspectorReactFrames"));
var _LogBoxInspectorStackFrames = _interopRequireDefault(require("./LogBoxInspectorStackFrames"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspector(props) {
  var logs = props.logs,
    selectedIndex = props.selectedIndex;
  var log = logs[selectedIndex];
  React.useEffect(function () {
    if (log) {
      LogBoxData.symbolicateLogNow(log);
    }
  }, [log]);
  React.useEffect(function () {
    if (logs.length > 1) {
      var selected = selectedIndex;
      var lastIndex = logs.length - 1;
      var prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
      var nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
      LogBoxData.symbolicateLogLazy(logs[prevIndex]);
      LogBoxData.symbolicateLogLazy(logs[nextIndex]);
    }
  }, [logs, selectedIndex]);
  React.useEffect(function () {
    _Keyboard.default.dismiss();
  }, []);
  function _handleRetry() {
    LogBoxData.retrySymbolicateLogNow(log);
  }
  if (log == null) {
    return null;
  }
  return (0, _jsxRuntime.jsxs)(_View.default, {
    style: styles.root,
    children: [(0, _jsxRuntime.jsx)(_LogBoxInspectorHeader.default, {
      onSelectIndex: props.onChangeSelectedIndex,
      selectedIndex: selectedIndex,
      total: logs.length,
      level: log.level
    }), (0, _jsxRuntime.jsx)(LogBoxInspectorBody, {
      log: log,
      onRetry: _handleRetry
    }), (0, _jsxRuntime.jsx)(_LogBoxInspectorFooter.default, {
      onDismiss: props.onDismiss,
      onMinimize: props.onMinimize,
      level: log.level
    })]
  });
}
var headerTitleMap = {
  warn: 'Console Warning',
  error: 'Console Error',
  fatal: 'Uncaught Error',
  syntax: 'Syntax Error',
  component: 'Render Error'
};
function LogBoxInspectorBody(props) {
  var _props$log$type;
  var _React$useState = React.useState(true),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    collapsed = _React$useState2[0],
    setCollapsed = _React$useState2[1];
  React.useEffect(function () {
    setCollapsed(true);
  }, [props.log]);
  var headerTitle = (_props$log$type = props.log.type) != null ? _props$log$type : headerTitleMap[props.log.isComponentError ? 'component' : props.log.level];
  if (collapsed) {
    return (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
      children: [(0, _jsxRuntime.jsx)(_LogBoxInspectorMessageHeader.default, {
        collapsed: collapsed,
        onPress: function onPress() {
          return setCollapsed(!collapsed);
        },
        message: props.log.message,
        level: props.log.level,
        title: headerTitle
      }), (0, _jsxRuntime.jsxs)(_ScrollView.default, {
        style: styles.scrollBody,
        children: [(0, _jsxRuntime.jsx)(_LogBoxInspectorCodeFrame.default, {
          codeFrame: props.log.codeFrame
        }), (0, _jsxRuntime.jsx)(_LogBoxInspectorReactFrames.default, {
          log: props.log
        }), (0, _jsxRuntime.jsx)(_LogBoxInspectorStackFrames.default, {
          log: props.log,
          onRetry: props.onRetry
        })]
      })]
    });
  }
  return (0, _jsxRuntime.jsxs)(_ScrollView.default, {
    style: styles.scrollBody,
    children: [(0, _jsxRuntime.jsx)(_LogBoxInspectorMessageHeader.default, {
      collapsed: collapsed,
      onPress: function onPress() {
        return setCollapsed(!collapsed);
      },
      message: props.log.message,
      level: props.log.level,
      title: headerTitle
    }), (0, _jsxRuntime.jsx)(_LogBoxInspectorCodeFrame.default, {
      codeFrame: props.log.codeFrame
    }), (0, _jsxRuntime.jsx)(_LogBoxInspectorReactFrames.default, {
      log: props.log
    }), (0, _jsxRuntime.jsx)(_LogBoxInspectorStackFrames.default, {
      log: props.log,
      onRetry: props.onRetry
    })]
  });
}
var styles = _StyleSheet.default.create({
  root: {
    flex: 1,
    backgroundColor: LogBoxStyle.getTextColor()
  },
  scrollBody: {
    backgroundColor: LogBoxStyle.getBackgroundColor(0.9),
    flex: 1
  }
});
var _default = LogBoxInspector;
exports.default = _default;
//# sourceMappingURL=LogBoxInspector.js.map