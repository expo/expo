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
var _Animation2 = _interopRequireDefault(require("./Animation"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var DecayAnimation = function (_Animation) {
  (0, _inherits2.default)(DecayAnimation, _Animation);
  var _super = _createSuper(DecayAnimation);
  function DecayAnimation(config) {
    var _config$deceleration, _config$isInteraction, _config$iterations;
    var _this;
    (0, _classCallCheck2.default)(this, DecayAnimation);
    _this = _super.call(this);
    _this._deceleration = (_config$deceleration = config.deceleration) != null ? _config$deceleration : 0.998;
    _this._velocity = config.velocity;
    _this._useNativeDriver = _NativeAnimatedHelper.default.shouldUseNativeDriver(config);
    _this._platformConfig = config.platformConfig;
    _this.__isInteraction = (_config$isInteraction = config.isInteraction) != null ? _config$isInteraction : !_this._useNativeDriver;
    _this.__iterations = (_config$iterations = config.iterations) != null ? _config$iterations : 1;
    return _this;
  }
  (0, _createClass2.default)(DecayAnimation, [{
    key: "__getNativeAnimationConfig",
    value: function __getNativeAnimationConfig() {
      return {
        type: 'decay',
        deceleration: this._deceleration,
        velocity: this._velocity,
        iterations: this.__iterations,
        platformConfig: this._platformConfig
      };
    }
  }, {
    key: "start",
    value: function start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
      this.__active = true;
      this._lastValue = fromValue;
      this._fromValue = fromValue;
      this._onUpdate = onUpdate;
      this.__onEnd = onEnd;
      this._startTime = Date.now();
      if (this._useNativeDriver) {
        this.__startNativeAnimation(animatedValue);
      } else {
        this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
      }
    }
  }, {
    key: "onUpdate",
    value: function onUpdate() {
      var now = Date.now();
      var value = this._fromValue + this._velocity / (1 - this._deceleration) * (1 - Math.exp(-(1 - this._deceleration) * (now - this._startTime)));
      this._onUpdate(value);
      if (Math.abs(this._lastValue - value) < 0.1) {
        this.__debouncedOnEnd({
          finished: true
        });
        return;
      }
      this._lastValue = value;
      if (this.__active) {
        this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(DecayAnimation.prototype), "stop", this).call(this);
      this.__active = false;
      global.cancelAnimationFrame(this._animationFrame);
      this.__debouncedOnEnd({
        finished: false
      });
    }
  }]);
  return DecayAnimation;
}(_Animation2.default);
exports.default = DecayAnimation;