'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnimatedEvent = void 0;
exports.attachNativeEvent = attachNativeEvent;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _RendererProxy = require("../ReactNative/RendererProxy");
var _NativeAnimatedHelper = _interopRequireDefault(require("./NativeAnimatedHelper"));
var _AnimatedValue = _interopRequireDefault(require("./nodes/AnimatedValue"));
var _AnimatedValueXY = _interopRequireDefault(require("./nodes/AnimatedValueXY"));
var _invariant = _interopRequireDefault(require("invariant"));
function attachNativeEvent(viewRef, eventName, argMapping, platformConfig) {
  var eventMappings = [];
  var traverse = function traverse(value, path) {
    if (value instanceof _AnimatedValue.default) {
      value.__makeNative(platformConfig);
      eventMappings.push({
        nativeEventPath: path,
        animatedValueTag: value.__getNativeTag()
      });
    } else if (value instanceof _AnimatedValueXY.default) {
      traverse(value.x, path.concat('x'));
      traverse(value.y, path.concat('y'));
    } else if (typeof value === 'object') {
      for (var _key in value) {
        traverse(value[_key], path.concat(_key));
      }
    }
  };
  (0, _invariant.default)(argMapping[0] && argMapping[0].nativeEvent, 'Native driven events only support animated values contained inside `nativeEvent`.');
  traverse(argMapping[0].nativeEvent, []);
  var viewTag = (0, _RendererProxy.findNodeHandle)(viewRef);
  if (viewTag != null) {
    eventMappings.forEach(function (mapping) {
      _NativeAnimatedHelper.default.API.addAnimatedEventToView(viewTag, eventName, mapping);
    });
  }
  return {
    detach: function detach() {
      if (viewTag != null) {
        eventMappings.forEach(function (mapping) {
          _NativeAnimatedHelper.default.API.removeAnimatedEventFromView(viewTag, eventName, mapping.animatedValueTag);
        });
      }
    }
  };
}
function validateMapping(argMapping, args) {
  var validate = function validate(recMapping, recEvt, key) {
    if (recMapping instanceof _AnimatedValue.default) {
      (0, _invariant.default)(typeof recEvt === 'number', 'Bad mapping of event key ' + key + ', should be number but got ' + typeof recEvt);
      return;
    }
    if (recMapping instanceof _AnimatedValueXY.default) {
      (0, _invariant.default)(typeof recEvt.x === 'number' && typeof recEvt.y === 'number', 'Bad mapping of event key ' + key + ', should be XY but got ' + recEvt);
      return;
    }
    if (typeof recEvt === 'number') {
      (0, _invariant.default)(recMapping instanceof _AnimatedValue.default, 'Bad mapping of type ' + typeof recMapping + ' for key ' + key + ', event value must map to AnimatedValue');
      return;
    }
    (0, _invariant.default)(typeof recMapping === 'object', 'Bad mapping of type ' + typeof recMapping + ' for key ' + key);
    (0, _invariant.default)(typeof recEvt === 'object', 'Bad event of type ' + typeof recEvt + ' for key ' + key);
    for (var mappingKey in recMapping) {
      validate(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
    }
  };
  (0, _invariant.default)(args.length >= argMapping.length, 'Event has less arguments than mapping');
  argMapping.forEach(function (mapping, idx) {
    validate(mapping, args[idx], 'arg' + idx);
  });
}
var AnimatedEvent = function () {
  function AnimatedEvent(argMapping, config) {
    var _this = this;
    (0, _classCallCheck2.default)(this, AnimatedEvent);
    this._listeners = [];
    this._callListeners = function () {
      for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
        args[_key2] = arguments[_key2];
      }
      _this._listeners.forEach(function (listener) {
        return listener.apply(void 0, args);
      });
    };
    this._argMapping = argMapping;
    if (config == null) {
      console.warn('Animated.event now requires a second argument for options');
      config = {
        useNativeDriver: false
      };
    }
    if (config.listener) {
      this.__addListener(config.listener);
    }
    this._attachedEvent = null;
    this.__isNative = _NativeAnimatedHelper.default.shouldUseNativeDriver(config);
    this.__platformConfig = config.platformConfig;
  }
  (0, _createClass2.default)(AnimatedEvent, [{
    key: "__addListener",
    value: function __addListener(callback) {
      this._listeners.push(callback);
    }
  }, {
    key: "__removeListener",
    value: function __removeListener(callback) {
      this._listeners = this._listeners.filter(function (listener) {
        return listener !== callback;
      });
    }
  }, {
    key: "__attach",
    value: function __attach(viewRef, eventName) {
      (0, _invariant.default)(this.__isNative, 'Only native driven events need to be attached.');
      this._attachedEvent = attachNativeEvent(viewRef, eventName, this._argMapping, this.__platformConfig);
    }
  }, {
    key: "__detach",
    value: function __detach(viewTag, eventName) {
      (0, _invariant.default)(this.__isNative, 'Only native driven events need to be detached.');
      this._attachedEvent && this._attachedEvent.detach();
    }
  }, {
    key: "__getHandler",
    value: function __getHandler() {
      var _this2 = this;
      if (this.__isNative) {
        if (__DEV__) {
          var _validatedMapping = false;
          return function () {
            for (var _len2 = arguments.length, args = new Array(_len2), _key3 = 0; _key3 < _len2; _key3++) {
              args[_key3] = arguments[_key3];
            }
            if (!_validatedMapping) {
              validateMapping(_this2._argMapping, args);
              _validatedMapping = true;
            }
            _this2._callListeners.apply(_this2, args);
          };
        } else {
          return this._callListeners;
        }
      }
      var validatedMapping = false;
      return function () {
        for (var _len3 = arguments.length, args = new Array(_len3), _key4 = 0; _key4 < _len3; _key4++) {
          args[_key4] = arguments[_key4];
        }
        if (__DEV__ && !validatedMapping) {
          validateMapping(_this2._argMapping, args);
          validatedMapping = true;
        }
        var traverse = function traverse(recMapping, recEvt) {
          if (recMapping instanceof _AnimatedValue.default) {
            if (typeof recEvt === 'number') {
              recMapping.setValue(recEvt);
            }
          } else if (recMapping instanceof _AnimatedValueXY.default) {
            if (typeof recEvt === 'object') {
              traverse(recMapping.x, recEvt.x);
              traverse(recMapping.y, recEvt.y);
            }
          } else if (typeof recMapping === 'object') {
            for (var mappingKey in recMapping) {
              traverse(recMapping[mappingKey], recEvt[mappingKey]);
            }
          }
        };
        _this2._argMapping.forEach(function (mapping, idx) {
          traverse(mapping, args[idx]);
        });
        _this2._callListeners.apply(_this2, args);
      };
    }
  }]);
  return AnimatedEvent;
}();
exports.AnimatedEvent = AnimatedEvent;
//# sourceMappingURL=AnimatedEvent.js.map