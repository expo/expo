var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getCollapseMessage = getCollapseMessage;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _openFileInEditor = _interopRequireDefault(require("../../Core/Devtools/openFileInEditor"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var _LogBoxInspectorSection = _interopRequireDefault(require("./LogBoxInspectorSection"));
var _LogBoxInspectorSourceMapStatus = _interopRequireDefault(require("./LogBoxInspectorSourceMapStatus"));
var _LogBoxInspectorStackFrame = _interopRequireDefault(require("./LogBoxInspectorStackFrame"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function getCollapseMessage(stackFrames, collapsed) {
  if (stackFrames.length === 0) {
    return 'No frames to show';
  }
  var collapsedCount = stackFrames.reduce(function (count, _ref) {
    var collapse = _ref.collapse;
    if (collapse === true) {
      return count + 1;
    }
    return count;
  }, 0);
  if (collapsedCount === 0) {
    return 'Showing all frames';
  }
  var framePlural = `frame${collapsedCount > 1 ? 's' : ''}`;
  if (collapsedCount === stackFrames.length) {
    return collapsed ? `See${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} collapsed ${framePlural}` : `Collapse${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} ${framePlural}`;
  } else {
    return collapsed ? `See ${collapsedCount} more ${framePlural}` : `Collapse ${collapsedCount} ${framePlural}`;
  }
}
function LogBoxInspectorStackFrames(props) {
  var _React$useState = React.useState(function () {
      return props.log.getAvailableStack().some(function (_ref2) {
        var collapse = _ref2.collapse;
        return !collapse;
      });
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    collapsed = _React$useState2[0],
    setCollapsed = _React$useState2[1];
  function getStackList() {
    if (collapsed === true) {
      return props.log.getAvailableStack().filter(function (_ref3) {
        var collapse = _ref3.collapse;
        return !collapse;
      });
    } else {
      return props.log.getAvailableStack();
    }
  }
  if (props.log.getAvailableStack().length === 0) {
    return null;
  }
  return (0, _jsxRuntime.jsxs)(_LogBoxInspectorSection.default, {
    heading: "Call Stack",
    action: (0, _jsxRuntime.jsx)(_LogBoxInspectorSourceMapStatus.default, {
      onPress: props.log.symbolicated.status === 'FAILED' ? props.onRetry : null,
      status: props.log.symbolicated.status
    }),
    children: [props.log.symbolicated.status !== 'COMPLETE' && (0, _jsxRuntime.jsx)(_View.default, {
      style: stackStyles.hintBox,
      children: (0, _jsxRuntime.jsx)(_Text.default, {
        style: stackStyles.hintText,
        children: "This call stack is not symbolicated. Some features are unavailable such as viewing the function name or tapping to open files."
      })
    }), (0, _jsxRuntime.jsx)(StackFrameList, {
      list: getStackList(),
      status: props.log.symbolicated.status
    }), (0, _jsxRuntime.jsx)(StackFrameFooter, {
      onPress: function onPress() {
        return setCollapsed(!collapsed);
      },
      message: getCollapseMessage(props.log.getAvailableStack(), collapsed)
    })]
  });
}
function StackFrameList(props) {
  return (0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
    children: props.list.map(function (frame, index) {
      var file = frame.file,
        lineNumber = frame.lineNumber;
      return (0, _jsxRuntime.jsx)(_LogBoxInspectorStackFrame.default, {
        frame: frame,
        onPress: props.status === 'COMPLETE' && file != null && lineNumber != null ? function () {
          return (0, _openFileInEditor.default)(file, lineNumber);
        } : null
      }, index);
    })
  });
}
function StackFrameFooter(props) {
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: stackStyles.collapseContainer,
    children: (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
      backgroundColor: {
        default: 'transparent',
        pressed: LogBoxStyle.getBackgroundColor(1)
      },
      onPress: props.onPress,
      style: stackStyles.collapseButton,
      children: (0, _jsxRuntime.jsx)(_Text.default, {
        style: stackStyles.collapse,
        children: props.message
      })
    })
  });
}
var stackStyles = _StyleSheet.default.create({
  section: {
    marginTop: 15
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20
  },
  body: {
    paddingBottom: 10
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 27
  },
  hintText: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 13,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '400',
    marginHorizontal: 10
  },
  hintBox: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginHorizontal: 10,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 5
  },
  collapseContainer: {
    marginLeft: 15,
    flexDirection: 'row'
  },
  collapseButton: {
    borderRadius: 5
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 20,
    marginTop: 0,
    paddingHorizontal: 10,
    paddingVertical: 5
  }
});
var _default = LogBoxInspectorStackFrames;
exports.default = _default;