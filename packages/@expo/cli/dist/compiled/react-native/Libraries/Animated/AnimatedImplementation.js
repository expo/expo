'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _AnimatedEvent = require("./AnimatedEvent");
var _DecayAnimation = _interopRequireDefault(require("./animations/DecayAnimation"));
var _SpringAnimation = _interopRequireDefault(require("./animations/SpringAnimation"));
var _TimingAnimation = _interopRequireDefault(require("./animations/TimingAnimation"));
var _createAnimatedComponent = _interopRequireDefault(require("./createAnimatedComponent"));
var _AnimatedAddition = _interopRequireDefault(require("./nodes/AnimatedAddition"));
var _AnimatedColor = _interopRequireDefault(require("./nodes/AnimatedColor"));
var _AnimatedDiffClamp = _interopRequireDefault(require("./nodes/AnimatedDiffClamp"));
var _AnimatedDivision = _interopRequireDefault(require("./nodes/AnimatedDivision"));
var _AnimatedInterpolation = _interopRequireDefault(require("./nodes/AnimatedInterpolation"));
var _AnimatedModulo = _interopRequireDefault(require("./nodes/AnimatedModulo"));
var _AnimatedMultiplication = _interopRequireDefault(require("./nodes/AnimatedMultiplication"));
var _AnimatedNode = _interopRequireDefault(require("./nodes/AnimatedNode"));
var _AnimatedSubtraction = _interopRequireDefault(require("./nodes/AnimatedSubtraction"));
var _AnimatedTracking = _interopRequireDefault(require("./nodes/AnimatedTracking"));
var _AnimatedValue = _interopRequireDefault(require("./nodes/AnimatedValue"));
var _AnimatedValueXY = _interopRequireDefault(require("./nodes/AnimatedValueXY"));
var add = function add(a, b) {
  return new _AnimatedAddition.default(a, b);
};
var subtract = function subtract(a, b) {
  return new _AnimatedSubtraction.default(a, b);
};
var divide = function divide(a, b) {
  return new _AnimatedDivision.default(a, b);
};
var multiply = function multiply(a, b) {
  return new _AnimatedMultiplication.default(a, b);
};
var modulo = function modulo(a, modulus) {
  return new _AnimatedModulo.default(a, modulus);
};
var diffClamp = function diffClamp(a, min, max) {
  return new _AnimatedDiffClamp.default(a, min, max);
};
var _combineCallbacks = function _combineCallbacks(callback, config) {
  if (callback && config.onComplete) {
    return function () {
      config.onComplete && config.onComplete.apply(config, arguments);
      callback && callback.apply(void 0, arguments);
    };
  } else {
    return callback || config.onComplete;
  }
};
var maybeVectorAnim = function maybeVectorAnim(value, config, anim) {
  if (value instanceof _AnimatedValueXY.default) {
    var configX = Object.assign({}, config);
    var configY = Object.assign({}, config);
    for (var key in config) {
      var _config$key = config[key],
        x = _config$key.x,
        y = _config$key.y;
      if (x !== undefined && y !== undefined) {
        configX[key] = x;
        configY[key] = y;
      }
    }
    var aX = anim(value.x, configX);
    var aY = anim(value.y, configY);
    return parallel([aX, aY], {
      stopTogether: false
    });
  } else if (value instanceof _AnimatedColor.default) {
    var configR = Object.assign({}, config);
    var configG = Object.assign({}, config);
    var configB = Object.assign({}, config);
    var configA = Object.assign({}, config);
    for (var _key in config) {
      var _config$_key = config[_key],
        r = _config$_key.r,
        g = _config$_key.g,
        b = _config$_key.b,
        a = _config$_key.a;
      if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
        configR[_key] = r;
        configG[_key] = g;
        configB[_key] = b;
        configA[_key] = a;
      }
    }
    var aR = anim(value.r, configR);
    var aG = anim(value.g, configG);
    var aB = anim(value.b, configB);
    var aA = anim(value.a, configA);
    return parallel([aR, aG, aB, aA], {
      stopTogether: false
    });
  }
  return null;
};
var spring = function spring(value, config) {
  var _start = function start(animatedValue, configuration, callback) {
    callback = _combineCallbacks(callback, configuration);
    var singleValue = animatedValue;
    var singleConfig = configuration;
    singleValue.stopTracking();
    if (configuration.toValue instanceof _AnimatedNode.default) {
      singleValue.track(new _AnimatedTracking.default(singleValue, configuration.toValue, _SpringAnimation.default, singleConfig, callback));
    } else {
      singleValue.animate(new _SpringAnimation.default(singleConfig), callback);
    }
  };
  return maybeVectorAnim(value, config, spring) || {
    start: function start(callback) {
      _start(value, config, callback);
    },
    stop: function stop() {
      value.stopAnimation();
    },
    reset: function reset() {
      value.resetAnimation();
    },
    _startNativeLoop: function _startNativeLoop(iterations) {
      var singleConfig = Object.assign({}, config, {
        iterations: iterations
      });
      _start(value, singleConfig);
    },
    _isUsingNativeDriver: function _isUsingNativeDriver() {
      return config.useNativeDriver || false;
    }
  };
};
var timing = function timing(value, config) {
  var _start2 = function start(animatedValue, configuration, callback) {
    callback = _combineCallbacks(callback, configuration);
    var singleValue = animatedValue;
    var singleConfig = configuration;
    singleValue.stopTracking();
    if (configuration.toValue instanceof _AnimatedNode.default) {
      singleValue.track(new _AnimatedTracking.default(singleValue, configuration.toValue, _TimingAnimation.default, singleConfig, callback));
    } else {
      singleValue.animate(new _TimingAnimation.default(singleConfig), callback);
    }
  };
  return maybeVectorAnim(value, config, timing) || {
    start: function start(callback) {
      _start2(value, config, callback);
    },
    stop: function stop() {
      value.stopAnimation();
    },
    reset: function reset() {
      value.resetAnimation();
    },
    _startNativeLoop: function _startNativeLoop(iterations) {
      var singleConfig = Object.assign({}, config, {
        iterations: iterations
      });
      _start2(value, singleConfig);
    },
    _isUsingNativeDriver: function _isUsingNativeDriver() {
      return config.useNativeDriver || false;
    }
  };
};
var decay = function decay(value, config) {
  var _start3 = function start(animatedValue, configuration, callback) {
    callback = _combineCallbacks(callback, configuration);
    var singleValue = animatedValue;
    var singleConfig = configuration;
    singleValue.stopTracking();
    singleValue.animate(new _DecayAnimation.default(singleConfig), callback);
  };
  return maybeVectorAnim(value, config, decay) || {
    start: function start(callback) {
      _start3(value, config, callback);
    },
    stop: function stop() {
      value.stopAnimation();
    },
    reset: function reset() {
      value.resetAnimation();
    },
    _startNativeLoop: function _startNativeLoop(iterations) {
      var singleConfig = Object.assign({}, config, {
        iterations: iterations
      });
      _start3(value, singleConfig);
    },
    _isUsingNativeDriver: function _isUsingNativeDriver() {
      return config.useNativeDriver || false;
    }
  };
};
var sequence = function sequence(animations) {
  var current = 0;
  return {
    start: function start(callback) {
      var onComplete = function onComplete(result) {
        if (!result.finished) {
          callback && callback(result);
          return;
        }
        current++;
        if (current === animations.length) {
          callback && callback(result);
          return;
        }
        animations[current].start(onComplete);
      };
      if (animations.length === 0) {
        callback && callback({
          finished: true
        });
      } else {
        animations[current].start(onComplete);
      }
    },
    stop: function stop() {
      if (current < animations.length) {
        animations[current].stop();
      }
    },
    reset: function reset() {
      animations.forEach(function (animation, idx) {
        if (idx <= current) {
          animation.reset();
        }
      });
      current = 0;
    },
    _startNativeLoop: function _startNativeLoop() {
      throw new Error('Loops run using the native driver cannot contain Animated.sequence animations');
    },
    _isUsingNativeDriver: function _isUsingNativeDriver() {
      return false;
    }
  };
};
var parallel = function parallel(animations, config) {
  var doneCount = 0;
  var hasEnded = {};
  var stopTogether = !(config && config.stopTogether === false);
  var result = {
    start: function start(callback) {
      if (doneCount === animations.length) {
        callback && callback({
          finished: true
        });
        return;
      }
      animations.forEach(function (animation, idx) {
        var cb = function cb(endResult) {
          hasEnded[idx] = true;
          doneCount++;
          if (doneCount === animations.length) {
            doneCount = 0;
            callback && callback(endResult);
            return;
          }
          if (!endResult.finished && stopTogether) {
            result.stop();
          }
        };
        if (!animation) {
          cb({
            finished: true
          });
        } else {
          animation.start(cb);
        }
      });
    },
    stop: function stop() {
      animations.forEach(function (animation, idx) {
        !hasEnded[idx] && animation.stop();
        hasEnded[idx] = true;
      });
    },
    reset: function reset() {
      animations.forEach(function (animation, idx) {
        animation.reset();
        hasEnded[idx] = false;
        doneCount = 0;
      });
    },
    _startNativeLoop: function _startNativeLoop() {
      throw new Error('Loops run using the native driver cannot contain Animated.parallel animations');
    },
    _isUsingNativeDriver: function _isUsingNativeDriver() {
      return false;
    }
  };
  return result;
};
var delay = function delay(time) {
  return timing(new _AnimatedValue.default(0), {
    toValue: 0,
    delay: time,
    duration: 0,
    useNativeDriver: false
  });
};
var stagger = function stagger(time, animations) {
  return parallel(animations.map(function (animation, i) {
    return sequence([delay(time * i), animation]);
  }));
};
var loop = function loop(animation) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    _ref$iterations = _ref.iterations,
    iterations = _ref$iterations === void 0 ? -1 : _ref$iterations,
    _ref$resetBeforeItera = _ref.resetBeforeIteration,
    resetBeforeIteration = _ref$resetBeforeItera === void 0 ? true : _ref$resetBeforeItera;
  var isFinished = false;
  var iterationsSoFar = 0;
  return {
    start: function start(callback) {
      var restart = function restart() {
        var result = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
          finished: true
        };
        if (isFinished || iterationsSoFar === iterations || result.finished === false) {
          callback && callback(result);
        } else {
          iterationsSoFar++;
          resetBeforeIteration && animation.reset();
          animation.start(restart);
        }
      };
      if (!animation || iterations === 0) {
        callback && callback({
          finished: true
        });
      } else {
        if (animation._isUsingNativeDriver()) {
          animation._startNativeLoop(iterations);
        } else {
          restart();
        }
      }
    },
    stop: function stop() {
      isFinished = true;
      animation.stop();
    },
    reset: function reset() {
      iterationsSoFar = 0;
      isFinished = false;
      animation.reset();
    },
    _startNativeLoop: function _startNativeLoop() {
      throw new Error('Loops run using the native driver cannot contain Animated.loop animations');
    },
    _isUsingNativeDriver: function _isUsingNativeDriver() {
      return animation._isUsingNativeDriver();
    }
  };
};
function forkEvent(event, listener) {
  if (!event) {
    return listener;
  } else if (event instanceof _AnimatedEvent.AnimatedEvent) {
    event.__addListener(listener);
    return event;
  } else {
    return function () {
      typeof event === 'function' && event.apply(void 0, arguments);
      listener.apply(void 0, arguments);
    };
  }
}
function unforkEvent(event, listener) {
  if (event && event instanceof _AnimatedEvent.AnimatedEvent) {
    event.__removeListener(listener);
  }
}
var event = function event(argMapping, config) {
  var animatedEvent = new _AnimatedEvent.AnimatedEvent(argMapping, config);
  if (animatedEvent.__isNative) {
    return animatedEvent;
  } else {
    return animatedEvent.__getHandler();
  }
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
  add: add,
  subtract: subtract,
  divide: divide,
  multiply: multiply,
  modulo: modulo,
  diffClamp: diffClamp,
  delay: delay,
  sequence: sequence,
  parallel: parallel,
  stagger: stagger,
  loop: loop,
  event: event,
  createAnimatedComponent: _createAnimatedComponent.default,
  attachNativeEvent: _AnimatedEvent.attachNativeEvent,
  forkEvent: forkEvent,
  unforkEvent: unforkEvent,
  Event: _AnimatedEvent.AnimatedEvent
};
exports.default = _default;