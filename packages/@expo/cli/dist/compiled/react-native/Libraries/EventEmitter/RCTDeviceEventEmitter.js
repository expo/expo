var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _EventEmitter = _interopRequireDefault(require("../vendor/emitter/EventEmitter"));
var RCTDeviceEventEmitter = new _EventEmitter.default();
Object.defineProperty(global, '__rctDeviceEventEmitter', {
  configurable: true,
  value: RCTDeviceEventEmitter
});
var _default = RCTDeviceEventEmitter;
exports.default = _default;