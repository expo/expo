var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _openFileInEditor = _interopRequireDefault(require("../../Core/Devtools/openFileInEditor"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var _LogBoxInspectorSection = _interopRequireDefault(require("./LogBoxInspectorSection"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var BEFORE_SLASH_RE = /^(.*)[\\/]/;
function getPrettyFileName(path) {
  var fileName = path.replace(BEFORE_SLASH_RE, '');
  if (/^index\./.test(fileName)) {
    var match = path.match(BEFORE_SLASH_RE);
    if (match) {
      var pathBeforeSlash = match[1];
      if (pathBeforeSlash) {
        var folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
        fileName = folderName + '/​' + fileName;
      }
    }
  }
  return fileName;
}
function LogBoxInspectorReactFrames(props) {
  var _React$useState = React.useState(true),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    collapsed = _React$useState2[0],
    setCollapsed = _React$useState2[1];
  if (props.log.componentStack == null || props.log.componentStack.length < 1) {
    return null;
  }
  function getStackList() {
    if (collapsed) {
      return props.log.componentStack.slice(0, 3);
    } else {
      return props.log.componentStack;
    }
  }
  function getCollapseMessage() {
    if (props.log.componentStack.length <= 3) {
      return;
    }
    var count = props.log.componentStack.length - 3;
    if (collapsed) {
      return `See ${count} more components`;
    } else {
      return `Collapse ${count} components`;
    }
  }
  return (0, _jsxRuntime.jsxs)(_LogBoxInspectorSection.default, {
    heading: "Component Stack",
    children: [getStackList().map(function (frame, index) {
      return (0, _jsxRuntime.jsx)(_View.default, {
        style: componentStyles.frameContainer,
        children: (0, _jsxRuntime.jsxs)(_LogBoxButton.default, {
          backgroundColor: {
            default: 'transparent',
            pressed: LogBoxStyle.getBackgroundColor(1)
          },
          onPress: frame.fileName.startsWith('/') ? function () {
            var _frame$location$row, _frame$location;
            return (0, _openFileInEditor.default)(frame.fileName, (_frame$location$row = (_frame$location = frame.location) == null ? void 0 : _frame$location.row) != null ? _frame$location$row : 1);
          } : null,
          style: componentStyles.frame,
          children: [(0, _jsxRuntime.jsx)(_View.default, {
            style: componentStyles.component,
            children: (0, _jsxRuntime.jsxs)(_Text.default, {
              style: componentStyles.frameName,
              children: [(0, _jsxRuntime.jsx)(_Text.default, {
                style: componentStyles.bracket,
                children: '<'
              }), frame.content, (0, _jsxRuntime.jsx)(_Text.default, {
                style: componentStyles.bracket,
                children: ' />'
              })]
            })
          }), (0, _jsxRuntime.jsxs)(_Text.default, {
            style: componentStyles.frameLocation,
            children: [getPrettyFileName(frame.fileName), frame.location ? `:${frame.location.row}` : '']
          })]
        })
      }, index);
    }), (0, _jsxRuntime.jsx)(_View.default, {
      style: componentStyles.collapseContainer,
      children: (0, _jsxRuntime.jsx)(_LogBoxButton.default, {
        backgroundColor: {
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundColor(1)
        },
        onPress: function onPress() {
          return setCollapsed(!collapsed);
        },
        style: componentStyles.collapseButton,
        children: (0, _jsxRuntime.jsx)(_Text.default, {
          style: componentStyles.collapse,
          children: getCollapseMessage()
        })
      })
    })]
  });
}
var componentStyles = _StyleSheet.default.create({
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
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  frameContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15
  },
  frame: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5
  },
  component: {
    flexDirection: 'row',
    paddingRight: 10
  },
  frameName: {
    fontFamily: _Platform.default.select({
      android: 'monospace',
      ios: 'Menlo'
    }),
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18
  },
  bracket: {
    fontFamily: _Platform.default.select({
      android: 'monospace',
      ios: 'Menlo'
    }),
    color: LogBoxStyle.getTextColor(0.4),
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18
  },
  frameLocation: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10
  }
});
var _default = LogBoxInspectorReactFrames;
exports.default = _default;
//# sourceMappingURL=LogBoxInspectorReactFrames.js.map