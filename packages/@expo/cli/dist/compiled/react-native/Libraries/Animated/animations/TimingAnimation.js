'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _AnimatedColor = _interopRequireDefault(require("../nodes/AnimatedColor"));
var _Animation2 = _interopRequireDefault(require("./Animation"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var _easeInOut;
function easeInOut() {
  if (!_easeInOut) {
    var Easing = require("../Easing").default;
    _easeInOut = Easing.inOut(Easing.ease);
  }
  return _easeInOut;
}
var TimingAnimation = function (_Animation) {
  (0, _inherits2.default)(TimingAnimation, _Animation);
  var _super = _createSuper(TimingAnimation);
  function TimingAnimation(config) {
    var _config$easing, _config$duration, _config$delay, _config$iterations, _config$isInteraction;
    var _this;
    (0, _classCallCheck2.default)(this, TimingAnimation);
    _this = _super.call(this);
    _this._toValue = config.toValue;
    _this._easing = (_config$easing = config.easing) != null ? _config$easing : easeInOut();
    _this._duration = (_config$duration = config.duration) != null ? _config$duration : 500;
    _this._delay = (_config$delay = config.delay) != null ? _config$delay : 0;
    _this.__iterations = (_config$iterations = config.iterations) != null ? _config$iterations : 1;
    _this._useNativeDriver = _NativeAnimatedHelper.default.shouldUseNativeDriver(config);
    _this._platformConfig = config.platformConfig;
    _this.__isInteraction = (_config$isInteraction = config.isInteraction) != null ? _config$isInteraction : !_this._useNativeDriver;
    return _this;
  }
  (0, _createClass2.default)(TimingAnimation, [{
    key: "__getNativeAnimationConfig",
    value: function __getNativeAnimationConfig() {
      var frameDuration = 1000.0 / 60.0;
      var frames = [];
      var numFrames = Math.round(this._duration / frameDuration);
      for (var frame = 0; frame < numFrames; frame++) {
        frames.push(this._easing(frame / numFrames));
      }
      frames.push(this._easing(1));
      return {
        type: 'frames',
        frames: frames,
        toValue: this._toValue,
        iterations: this.__iterations,
        platformConfig: this._platformConfig
      };
    }
  }, {
    key: "start",
    value: function start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
      var _this2 = this;
      this.__active = true;
      this._fromValue = fromValue;
      this._onUpdate = onUpdate;
      this.__onEnd = onEnd;
      var start = function start() {
        if (_this2._duration === 0 && !_this2._useNativeDriver) {
          _this2._onUpdate(_this2._toValue);
          _this2.__debouncedOnEnd({
            finished: true
          });
        } else {
          _this2._startTime = Date.now();
          if (_this2._useNativeDriver) {
            _this2.__startNativeAnimation(animatedValue);
          } else {
            _this2._animationFrame = requestAnimationFrame(_this2.onUpdate.bind(_this2));
          }
        }
      };
      if (this._delay) {
        this._timeout = setTimeout(start, this._delay);
      } else {
        start();
      }
    }
  }, {
    key: "onUpdate",
    value: function onUpdate() {
      var now = Date.now();
      if (now >= this._startTime + this._duration) {
        if (this._duration === 0) {
          this._onUpdate(this._toValue);
        } else {
          this._onUpdate(this._fromValue + this._easing(1) * (this._toValue - this._fromValue));
        }
        this.__debouncedOnEnd({
          finished: true
        });
        return;
      }
      this._onUpdate(this._fromValue + this._easing((now - this._startTime) / this._duration) * (this._toValue - this._fromValue));
      if (this.__active) {
        this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(TimingAnimation.prototype), "stop", this).call(this);
      this.__active = false;
      clearTimeout(this._timeout);
      global.cancelAnimationFrame(this._animationFrame);
      this.__debouncedOnEnd({
        finished: false
      });
    }
  }]);
  return TimingAnimation;
}(_Animation2.default);
exports.default = TimingAnimation;
//# sourceMappingURL=TimingAnimation.js.map