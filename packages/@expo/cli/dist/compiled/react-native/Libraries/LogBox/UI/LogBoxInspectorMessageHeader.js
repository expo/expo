var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _LogBoxMessage = _interopRequireDefault(require("./LogBoxMessage"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var SHOW_MORE_MESSAGE_LENGTH = 300;
function LogBoxInspectorMessageHeader(props) {
  function renderShowMore() {
    if (props.message.content.length < SHOW_MORE_MESSAGE_LENGTH || !props.collapsed) {
      return null;
    }
    return (0, _jsxRuntime.jsx)(_Text.default, {
      style: messageStyles.collapse,
      onPress: function onPress() {
        return props.onPress();
      },
      children: "... See More"
    });
  }
  return (0, _jsxRuntime.jsxs)(_View.default, {
    style: messageStyles.body,
    children: [(0, _jsxRuntime.jsx)(_View.default, {
      style: messageStyles.heading,
      children: (0, _jsxRuntime.jsx)(_Text.default, {
        style: [messageStyles.headingText, messageStyles[props.level]],
        children: props.title
      })
    }), (0, _jsxRuntime.jsxs)(_Text.default, {
      style: messageStyles.bodyText,
      children: [(0, _jsxRuntime.jsx)(_LogBoxMessage.default, {
        maxLength: props.collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity,
        message: props.message,
        style: messageStyles.messageText
      }), renderShowMore()]
    })]
  });
}
var messageStyles = _StyleSheet.default.create({
  body: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 2,
    shadowOpacity: 0.5,
    flex: 0
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingBottom: 10
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 5
  },
  headingText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 28
  },
  warn: {
    color: LogBoxStyle.getWarningColor(1)
  },
  error: {
    color: LogBoxStyle.getErrorColor(1)
  },
  fatal: {
    color: LogBoxStyle.getFatalColor(1)
  },
  syntax: {
    color: LogBoxStyle.getFatalColor(1)
  },
  messageText: {
    color: LogBoxStyle.getTextColor(0.6)
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 12
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3
  }
});
var _default = LogBoxInspectorMessageHeader;
exports.default = _default;
//# sourceMappingURL=LogBoxInspectorMessageHeader.js.map