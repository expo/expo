var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConditionallyIgnoredEventHandlers = ConditionallyIgnoredEventHandlers;
exports.DynamicallyInjectedByGestureHandler = DynamicallyInjectedByGestureHandler;
exports.isIgnored = isIgnored;
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var ignoredViewConfigProps = new WeakSet();
function DynamicallyInjectedByGestureHandler(object) {
  ignoredViewConfigProps.add(object);
  return object;
}
function ConditionallyIgnoredEventHandlers(value) {
  if (_Platform.default.OS === 'ios') {
    return value;
  }
  return undefined;
}
function isIgnored(value) {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}