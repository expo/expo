var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._LogBoxNotificationContainer = _LogBoxNotificationContainer;
exports.default = void 0;
var _View = _interopRequireDefault(require("../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var LogBoxData = _interopRequireWildcard(require("./Data/LogBoxData"));
var _LogBoxLog = _interopRequireDefault(require("./Data/LogBoxLog"));
var _LogBoxNotification = _interopRequireDefault(require("./UI/LogBoxNotification"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _LogBoxNotificationContainer(props) {
  var logs = props.logs;
  var onDismissWarns = function onDismissWarns() {
    LogBoxData.clearWarnings();
  };
  var onDismissErrors = function onDismissErrors() {
    LogBoxData.clearErrors();
  };
  var setSelectedLog = function setSelectedLog(index) {
    LogBoxData.setSelectedLog(index);
  };
  function openLog(log) {
    var index = logs.length - 1;
    while (index > 0 && logs[index] !== log) {
      index -= 1;
    }
    setSelectedLog(index);
  }
  if (logs.length === 0 || props.isDisabled === true) {
    return null;
  }
  var warnings = logs.filter(function (log) {
    return log.level === 'warn';
  });
  var errors = logs.filter(function (log) {
    return log.level === 'error' || log.level === 'fatal';
  });
  return (0, _jsxRuntime.jsxs)(_View.default, {
    style: styles.list,
    children: [warnings.length > 0 && (0, _jsxRuntime.jsx)(_View.default, {
      style: styles.toast,
      children: (0, _jsxRuntime.jsx)(_LogBoxNotification.default, {
        log: warnings[warnings.length - 1],
        level: "warn",
        totalLogCount: warnings.length,
        onPressOpen: function onPressOpen() {
          return openLog(warnings[warnings.length - 1]);
        },
        onPressDismiss: onDismissWarns
      })
    }), errors.length > 0 && (0, _jsxRuntime.jsx)(_View.default, {
      style: styles.toast,
      children: (0, _jsxRuntime.jsx)(_LogBoxNotification.default, {
        log: errors[errors.length - 1],
        level: "error",
        totalLogCount: errors.length,
        onPressOpen: function onPressOpen() {
          return openLog(errors[errors.length - 1]);
        },
        onPressDismiss: onDismissErrors
      })
    })]
  });
}
var styles = _StyleSheet.default.create({
  list: {
    bottom: 20,
    left: 10,
    right: 10,
    position: 'absolute'
  },
  toast: {
    borderRadius: 8,
    marginBottom: 5,
    overflow: 'hidden'
  }
});
var _default = LogBoxData.withSubscription(_LogBoxNotificationContainer);
exports.default = _default;
//# sourceMappingURL=LogBoxNotificationContainer.js.map