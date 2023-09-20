'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _AnimatedEvent = require("./AnimatedEvent");
var _AnimatedImplementation = _interopRequireDefault(require("./AnimatedImplementation"));
var _createAnimatedComponent = _interopRequireDefault(require("./createAnimatedComponent"));
var _AnimatedColor = _interopRequireDefault(require("./nodes/AnimatedColor"));
var _AnimatedInterpolation = _interopRequireDefault(require("./nodes/AnimatedInterpolation"));
var _AnimatedNode = _interopRequireDefault(require("./nodes/AnimatedNode"));
var _AnimatedValue = _interopRequireDefault(require("./nodes/AnimatedValue"));
var _AnimatedValueXY = _interopRequireDefault(require("./nodes/AnimatedValueXY"));
var inAnimationCallback = false;
function mockAnimationStart(start) {
  return function (callback) {
    var guardedCallback = callback == null ? callback : function () {
      if (inAnimationCallback) {
        console.warn('Ignoring recursive animation callback when running mock animations');
        return;
      }
      inAnimationCallback = true;
      try {
        callback.apply(void 0, arguments);
      } finally {
        inAnimationCallback = false;
      }
    };
    start(guardedCallback);
  };
}
var emptyAnimation = {
  start: function start() {},
  stop: function stop() {},
  reset: function reset() {},
  _startNativeLoop: function _startNativeLoop() {},
  _isUsingNativeDriver: function _isUsingNativeDriver() {
    return false;
  }
};
var mockCompositeAnimation = function mockCompositeAnimation(animations) {
  return Object.assign({}, emptyAnimation, {
    start: mockAnimationStart(function (callback) {
      animations.forEach(function (animation) {
        return animation.start();
      });
      callback == null ? void 0 : callback({
        finished: true
      });
    })
  });
};
var spring = function spring(value, config) {
  var anyValue = value;
  return Object.assign({}, emptyAnimation, {
    start: mockAnimationStart(function (callback) {
      anyValue.setValue(config.toValue);
      callback == null ? void 0 : callback({
        finished: true
      });
    })
  });
};
var timing = function timing(value, config) {
  var anyValue = value;
  return Object.assign({}, emptyAnimation, {
    start: mockAnimationStart(function (callback) {
      anyValue.setValue(config.toValue);
      callback == null ? void 0 : callback({
        finished: true
      });
    })
  });
};
var decay = function decay(value, config) {
  return emptyAnimation;
};
var sequence = function sequence(animations) {
  return mockCompositeAnimation(animations);
};
var parallel = function parallel(animations, config) {
  return mockCompositeAnimation(animations);
};
var delay = function delay(time) {
  return emptyAnimation;
};
var stagger = function stagger(time, animations) {
  return mockCompositeAnimation(animations);
};
var loop = function loop(animation) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    _ref$iterations = _ref.iterations,
    iterations = _ref$iterations === void 0 ? -1 : _ref$iterations;
  return emptyAnimation;
};
var _default = {
  Value: _AnimatedValue.default,
  ValueXY: _AnimatedValueXY.default,
  Color: _AnimatedColor.default,
  Interpolation: _AnimatedInterpolation.default,
  Node: _AnimatedNode.default,
  decay: decay,
  timing: timing,
  spring: spring,
  add: _AnimatedImplementation.default.add,
  subtract: _AnimatedImplementation.default.subtract,
  divide: _AnimatedImplementation.default.divide,
  multiply: _AnimatedImplementation.default.multiply,
  modulo: _AnimatedImplementation.default.modulo,
  diffClamp: _AnimatedImplementation.default.diffClamp,
  delay: delay,
  sequence: sequence,
  parallel: parallel,
  stagger: stagger,
  loop: loop,
  event: _AnimatedImplementation.default.event,
  createAnimatedComponent: _createAnimatedComponent.default,
  attachNativeEvent: _AnimatedEvent.attachNativeEvent,
  forkEvent: _AnimatedImplementation.default.forkEvent,
  unforkEvent: _AnimatedImplementation.default.unforkEvent,
  Event: _AnimatedEvent.AnimatedEvent
};
exports.default = _default;
//# sourceMappingURL=AnimatedMock.js.map