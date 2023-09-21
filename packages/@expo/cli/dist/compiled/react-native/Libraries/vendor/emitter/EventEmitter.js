var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var EventEmitter = function () {
  function EventEmitter() {
    (0, _classCallCheck2.default)(this, EventEmitter);
    this._registry = {};
  }
  (0, _createClass2.default)(EventEmitter, [{
    key: "addListener",
    value: function addListener(eventType, listener, context) {
      if (typeof listener !== 'function') {
        throw new TypeError('EventEmitter.addListener(...): 2nd argument must be a function.');
      }
      var registrations = allocate(this._registry, eventType);
      var registration = {
        context: context,
        listener: listener,
        remove: function remove() {
          registrations.delete(registration);
        }
      };
      registrations.add(registration);
      return registration;
    }
  }, {
    key: "emit",
    value: function emit(eventType) {
      var registrations = this._registry[eventType];
      if (registrations != null) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        for (var registration of (0, _toConsumableArray2.default)(registrations)) {
          registration.listener.apply(registration.context, args);
        }
      }
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(eventType) {
      if (eventType == null) {
        this._registry = {};
      } else {
        delete this._registry[eventType];
      }
    }
  }, {
    key: "listenerCount",
    value: function listenerCount(eventType) {
      var registrations = this._registry[eventType];
      return registrations == null ? 0 : registrations.size;
    }
  }]);
  return EventEmitter;
}();
exports.default = EventEmitter;
function allocate(registry, eventType) {
  var registrations = registry[eventType];
  if (registrations == null) {
    registrations = new Set();
    registry[eventType] = registrations;
  }
  return registrations;
}