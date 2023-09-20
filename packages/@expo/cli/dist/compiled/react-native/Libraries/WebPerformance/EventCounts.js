var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativePerformanceObserver = _interopRequireDefault(require("./NativePerformanceObserver"));
var _PerformanceObserver = require("./PerformanceObserver");
var cachedEventCounts;
function getCachedEventCounts() {
  var _cachedEventCounts;
  if (cachedEventCounts) {
    return cachedEventCounts;
  }
  if (!_NativePerformanceObserver.default) {
    (0, _PerformanceObserver.warnNoNativePerformanceObserver)();
    return new Map();
  }
  cachedEventCounts = new Map(_NativePerformanceObserver.default.getEventCounts());
  global.queueMicrotask(function () {
    cachedEventCounts = null;
  });
  return (_cachedEventCounts = cachedEventCounts) != null ? _cachedEventCounts : new Map();
}
var EventCounts = function () {
  function EventCounts() {
    (0, _classCallCheck2.default)(this, EventCounts);
  }
  (0, _createClass2.default)(EventCounts, [{
    key: "size",
    get: function get() {
      return getCachedEventCounts().size;
    }
  }, {
    key: "entries",
    value: function entries() {
      return getCachedEventCounts().entries();
    }
  }, {
    key: "forEach",
    value: function forEach(callback) {
      return getCachedEventCounts().forEach(callback);
    }
  }, {
    key: "get",
    value: function get(key) {
      return getCachedEventCounts().get(key);
    }
  }, {
    key: "has",
    value: function has(key) {
      return getCachedEventCounts().has(key);
    }
  }, {
    key: "keys",
    value: function keys() {
      return getCachedEventCounts().keys();
    }
  }, {
    key: "values",
    value: function values() {
      return getCachedEventCounts().values();
    }
  }]);
  return EventCounts;
}();
exports.default = EventCounts;
//# sourceMappingURL=EventCounts.js.map