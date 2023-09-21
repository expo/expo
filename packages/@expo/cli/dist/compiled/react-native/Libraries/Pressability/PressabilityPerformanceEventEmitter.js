var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var PressabilityPerformanceEventEmitter = function () {
  function PressabilityPerformanceEventEmitter() {
    (0, _classCallCheck2.default)(this, PressabilityPerformanceEventEmitter);
    this._listeners = [];
  }
  (0, _createClass2.default)(PressabilityPerformanceEventEmitter, [{
    key: "addListener",
    value: function addListener(listener) {
      this._listeners.push(listener);
    }
  }, {
    key: "removeListener",
    value: function removeListener(listener) {
      var index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    }
  }, {
    key: "emitEvent",
    value: function emitEvent(constructEvent) {
      if (this._listeners.length === 0) {
        return;
      }
      var event = constructEvent();
      this._listeners.forEach(function (listener) {
        return listener(event);
      });
    }
  }]);
  return PressabilityPerformanceEventEmitter;
}();
var PressabilityPerformanceEventEmitterSingleton = new PressabilityPerformanceEventEmitter();
var _default = PressabilityPerformanceEventEmitterSingleton;
exports.default = _default;