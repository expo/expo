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
var SpringConfig = _interopRequireWildcard(require("../SpringConfig"));
var _Animation2 = _interopRequireDefault(require("./Animation"));
var _invariant = _interopRequireDefault(require("invariant"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var SpringAnimation = function (_Animation) {
  (0, _inherits2.default)(SpringAnimation, _Animation);
  var _super = _createSuper(SpringAnimation);
  function SpringAnimation(config) {
    var _config$overshootClam, _config$restDisplacem, _config$restSpeedThre, _config$velocity, _config$velocity2, _config$delay, _config$isInteraction, _config$iterations;
    var _this;
    (0, _classCallCheck2.default)(this, SpringAnimation);
    _this = _super.call(this);
    _this._overshootClamping = (_config$overshootClam = config.overshootClamping) != null ? _config$overshootClam : false;
    _this._restDisplacementThreshold = (_config$restDisplacem = config.restDisplacementThreshold) != null ? _config$restDisplacem : 0.001;
    _this._restSpeedThreshold = (_config$restSpeedThre = config.restSpeedThreshold) != null ? _config$restSpeedThre : 0.001;
    _this._initialVelocity = (_config$velocity = config.velocity) != null ? _config$velocity : 0;
    _this._lastVelocity = (_config$velocity2 = config.velocity) != null ? _config$velocity2 : 0;
    _this._toValue = config.toValue;
    _this._delay = (_config$delay = config.delay) != null ? _config$delay : 0;
    _this._useNativeDriver = _NativeAnimatedHelper.default.shouldUseNativeDriver(config);
    _this._platformConfig = config.platformConfig;
    _this.__isInteraction = (_config$isInteraction = config.isInteraction) != null ? _config$isInteraction : !_this._useNativeDriver;
    _this.__iterations = (_config$iterations = config.iterations) != null ? _config$iterations : 1;
    if (config.stiffness !== undefined || config.damping !== undefined || config.mass !== undefined) {
      var _config$stiffness, _config$damping, _config$mass;
      (0, _invariant.default)(config.bounciness === undefined && config.speed === undefined && config.tension === undefined && config.friction === undefined, 'You can define one of bounciness/speed, tension/friction, or stiffness/damping/mass, but not more than one');
      _this._stiffness = (_config$stiffness = config.stiffness) != null ? _config$stiffness : 100;
      _this._damping = (_config$damping = config.damping) != null ? _config$damping : 10;
      _this._mass = (_config$mass = config.mass) != null ? _config$mass : 1;
    } else if (config.bounciness !== undefined || config.speed !== undefined) {
      var _config$bounciness, _config$speed;
      (0, _invariant.default)(config.tension === undefined && config.friction === undefined && config.stiffness === undefined && config.damping === undefined && config.mass === undefined, 'You can define one of bounciness/speed, tension/friction, or stiffness/damping/mass, but not more than one');
      var springConfig = SpringConfig.fromBouncinessAndSpeed((_config$bounciness = config.bounciness) != null ? _config$bounciness : 8, (_config$speed = config.speed) != null ? _config$speed : 12);
      _this._stiffness = springConfig.stiffness;
      _this._damping = springConfig.damping;
      _this._mass = 1;
    } else {
      var _config$tension, _config$friction;
      var _springConfig = SpringConfig.fromOrigamiTensionAndFriction((_config$tension = config.tension) != null ? _config$tension : 40, (_config$friction = config.friction) != null ? _config$friction : 7);
      _this._stiffness = _springConfig.stiffness;
      _this._damping = _springConfig.damping;
      _this._mass = 1;
    }
    (0, _invariant.default)(_this._stiffness > 0, 'Stiffness value must be greater than 0');
    (0, _invariant.default)(_this._damping > 0, 'Damping value must be greater than 0');
    (0, _invariant.default)(_this._mass > 0, 'Mass value must be greater than 0');
    return _this;
  }
  (0, _createClass2.default)(SpringAnimation, [{
    key: "__getNativeAnimationConfig",
    value: function __getNativeAnimationConfig() {
      var _this$_initialVelocit;
      return {
        type: 'spring',
        overshootClamping: this._overshootClamping,
        restDisplacementThreshold: this._restDisplacementThreshold,
        restSpeedThreshold: this._restSpeedThreshold,
        stiffness: this._stiffness,
        damping: this._damping,
        mass: this._mass,
        initialVelocity: (_this$_initialVelocit = this._initialVelocity) != null ? _this$_initialVelocit : this._lastVelocity,
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
      this._startPosition = fromValue;
      this._lastPosition = this._startPosition;
      this._onUpdate = onUpdate;
      this.__onEnd = onEnd;
      this._lastTime = Date.now();
      this._frameTime = 0.0;
      if (previousAnimation instanceof SpringAnimation) {
        var internalState = previousAnimation.getInternalState();
        this._lastPosition = internalState.lastPosition;
        this._lastVelocity = internalState.lastVelocity;
        this._initialVelocity = this._lastVelocity;
        this._lastTime = internalState.lastTime;
      }
      var start = function start() {
        if (_this2._useNativeDriver) {
          _this2.__startNativeAnimation(animatedValue);
        } else {
          _this2.onUpdate();
        }
      };
      if (this._delay) {
        this._timeout = setTimeout(start, this._delay);
      } else {
        start();
      }
    }
  }, {
    key: "getInternalState",
    value: function getInternalState() {
      return {
        lastPosition: this._lastPosition,
        lastVelocity: this._lastVelocity,
        lastTime: this._lastTime
      };
    }
  }, {
    key: "onUpdate",
    value: function onUpdate() {
      var MAX_STEPS = 64;
      var now = Date.now();
      if (now > this._lastTime + MAX_STEPS) {
        now = this._lastTime + MAX_STEPS;
      }
      var deltaTime = (now - this._lastTime) / 1000;
      this._frameTime += deltaTime;
      var c = this._damping;
      var m = this._mass;
      var k = this._stiffness;
      var v0 = -this._initialVelocity;
      var zeta = c / (2 * Math.sqrt(k * m));
      var omega0 = Math.sqrt(k / m);
      var omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta);
      var x0 = this._toValue - this._startPosition;
      var position = 0.0;
      var velocity = 0.0;
      var t = this._frameTime;
      if (zeta < 1) {
        var envelope = Math.exp(-zeta * omega0 * t);
        position = this._toValue - envelope * ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) + x0 * Math.cos(omega1 * t));
        velocity = zeta * omega0 * envelope * (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 + x0 * Math.cos(omega1 * t)) - envelope * (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) - omega1 * x0 * Math.sin(omega1 * t));
      } else {
        var _envelope = Math.exp(-omega0 * t);
        position = this._toValue - _envelope * (x0 + (v0 + omega0 * x0) * t);
        velocity = _envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
      }
      this._lastTime = now;
      this._lastPosition = position;
      this._lastVelocity = velocity;
      this._onUpdate(position);
      if (!this.__active) {
        return;
      }
      var isOvershooting = false;
      if (this._overshootClamping && this._stiffness !== 0) {
        if (this._startPosition < this._toValue) {
          isOvershooting = position > this._toValue;
        } else {
          isOvershooting = position < this._toValue;
        }
      }
      var isVelocity = Math.abs(velocity) <= this._restSpeedThreshold;
      var isDisplacement = true;
      if (this._stiffness !== 0) {
        isDisplacement = Math.abs(this._toValue - position) <= this._restDisplacementThreshold;
      }
      if (isOvershooting || isVelocity && isDisplacement) {
        if (this._stiffness !== 0) {
          this._lastPosition = this._toValue;
          this._lastVelocity = 0;
          this._onUpdate(this._toValue);
        }
        this.__debouncedOnEnd({
          finished: true
        });
        return;
      }
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }, {
    key: "stop",
    value: function stop() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(SpringAnimation.prototype), "stop", this).call(this);
      this.__active = false;
      clearTimeout(this._timeout);
      global.cancelAnimationFrame(this._animationFrame);
      this.__debouncedOnEnd({
        finished: false
      });
    }
  }]);
  return SpringAnimation;
}(_Animation2.default);
exports.default = SpringAnimation;
//# sourceMappingURL=SpringAnimation.js.map