var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useEventEmitter;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useEventEmitter(listen) {
  var listenRef = React.useRef(listen);
  React.useEffect(function () {
    listenRef.current = listen;
  });
  var listeners = React.useRef(Object.create(null));
  var create = React.useCallback(function (target) {
    var removeListener = function removeListener(type, callback) {
      var callbacks = listeners.current[type] ? listeners.current[type][target] : undefined;
      if (!callbacks) {
        return;
      }
      var index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
    var addListener = function addListener(type, callback) {
      listeners.current[type] = listeners.current[type] || {};
      listeners.current[type][target] = listeners.current[type][target] || [];
      listeners.current[type][target].push(callback);
      var removed = false;
      return function () {
        if (!removed) {
          removed = true;
          removeListener(type, callback);
        }
      };
    };
    return {
      addListener: addListener,
      removeListener: removeListener
    };
  }, []);
  var emit = React.useCallback(function (_ref) {
    var _items$target, _ref2;
    var type = _ref.type,
      data = _ref.data,
      target = _ref.target,
      canPreventDefault = _ref.canPreventDefault;
    var items = listeners.current[type] || {};
    var callbacks = target !== undefined ? (_items$target = items[target]) == null ? void 0 : _items$target.slice() : (_ref2 = []).concat.apply(_ref2, (0, _toConsumableArray2.default)(Object.keys(items).map(function (t) {
      return items[t];
    }))).filter(function (cb, i, self) {
      return self.lastIndexOf(cb) === i;
    });
    var event = {
      get type() {
        return type;
      }
    };
    if (target !== undefined) {
      Object.defineProperty(event, 'target', {
        enumerable: true,
        get: function get() {
          return target;
        }
      });
    }
    if (data !== undefined) {
      Object.defineProperty(event, 'data', {
        enumerable: true,
        get: function get() {
          return data;
        }
      });
    }
    if (canPreventDefault) {
      var defaultPrevented = false;
      Object.defineProperties(event, {
        defaultPrevented: {
          enumerable: true,
          get: function get() {
            return defaultPrevented;
          }
        },
        preventDefault: {
          enumerable: true,
          value: function value() {
            defaultPrevented = true;
          }
        }
      });
    }
    listenRef.current == null ? void 0 : listenRef.current(event);
    callbacks == null ? void 0 : callbacks.forEach(function (cb) {
      return cb(event);
    });
    return event;
  }, []);
  return React.useMemo(function () {
    return {
      create: create,
      emit: emit
    };
  }, [create, emit]);
}