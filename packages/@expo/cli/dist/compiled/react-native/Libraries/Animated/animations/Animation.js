'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var startNativeAnimationNextId = 1;
var Animation = function () {
  function Animation() {
    (0, _classCallCheck2.default)(this, Animation);
  }
  (0, _createClass2.default)(Animation, [{
    key: "start",
    value: function start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {}
  }, {
    key: "stop",
    value: function stop() {
      if (this.__nativeId) {
        _NativeAnimatedHelper.default.API.stopAnimation(this.__nativeId);
      }
    }
  }, {
    key: "__getNativeAnimationConfig",
    value: function __getNativeAnimationConfig() {
      throw new Error('This animation type cannot be offloaded to native');
    }
  }, {
    key: "__debouncedOnEnd",
    value: function __debouncedOnEnd(result) {
      var onEnd = this.__onEnd;
      this.__onEnd = null;
      onEnd && onEnd(result);
    }
  }, {
    key: "__startNativeAnimation",
    value: function __startNativeAnimation(animatedValue) {
      var startNativeAnimationWaitId = `${startNativeAnimationNextId}:startAnimation`;
      startNativeAnimationNextId += 1;
      _NativeAnimatedHelper.default.API.setWaitingForIdentifier(startNativeAnimationWaitId);
      try {
        var config = this.__getNativeAnimationConfig();
        animatedValue.__makeNative(config.platformConfig);
        this.__nativeId = _NativeAnimatedHelper.default.generateNewAnimationId();
        _NativeAnimatedHelper.default.API.startAnimatingNode(this.__nativeId, animatedValue.__getNativeTag(), config, this.__debouncedOnEnd.bind(this));
      } catch (e) {
        throw e;
      } finally {
        _NativeAnimatedHelper.default.API.unsetWaitingForIdentifier(startNativeAnimationWaitId);
      }
    }
  }]);
  return Animation;
}();
exports.default = Animation;
//# sourceMappingURL=Animation.js.map