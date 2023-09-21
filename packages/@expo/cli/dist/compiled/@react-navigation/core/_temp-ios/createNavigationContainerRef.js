var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NOT_INITIALIZED_ERROR = void 0;
exports.default = createNavigationContainerRef;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _routers = require("@react-navigation/routers");
var NOT_INITIALIZED_ERROR = "The 'navigation' object hasn't been initialized yet. This might happen if you don't have a navigator mounted, or if the navigator hasn't finished mounting. See https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization for more details.";
exports.NOT_INITIALIZED_ERROR = NOT_INITIALIZED_ERROR;
function createNavigationContainerRef() {
  var methods = [].concat((0, _toConsumableArray2.default)(Object.keys(_routers.CommonActions)), ['addListener', 'removeListener', 'resetRoot', 'dispatch', 'isFocused', 'canGoBack', 'getRootState', 'getState', 'getParent', 'getCurrentRoute', 'getCurrentOptions']);
  var listeners = {};
  var removeListener = function removeListener(event, callback) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(function (cb) {
        return cb !== callback;
      });
    }
  };
  var current = null;
  var ref = Object.assign({
    get current() {
      return current;
    },
    set current(value) {
      current = value;
      if (value != null) {
        Object.entries(listeners).forEach(function (_ref) {
          var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
            event = _ref2[0],
            callbacks = _ref2[1];
          callbacks.forEach(function (callback) {
            value.addListener(event, callback);
          });
        });
      }
    },
    isReady: function isReady() {
      if (current == null) {
        return false;
      }
      return current.isReady();
    }
  }, methods.reduce(function (acc, name) {
    acc[name] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (current == null) {
        switch (name) {
          case 'addListener':
            {
              var event = args[0],
                callback = args[1];
              listeners[event] = listeners[event] || [];
              listeners[event].push(callback);
              return function () {
                return removeListener(event, callback);
              };
            }
          case 'removeListener':
            {
              var _event = args[0],
                _callback = args[1];
              removeListener(_event, _callback);
              break;
            }
          default:
            console.error(NOT_INITIALIZED_ERROR);
        }
      } else {
        var _current;
        return (_current = current)[name].apply(_current, args);
      }
    };
    return acc;
  }, {}));
  return ref;
}