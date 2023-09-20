'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _FabricUIManager = require("../ReactNative/FabricUIManager");
var _ReactNativeFeatureFlags = _interopRequireDefault(require("../ReactNative/ReactNativeFeatureFlags"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var UIManager = require("../ReactNative/UIManager");
var isLayoutAnimationEnabled = _ReactNativeFeatureFlags.default.isLayoutAnimationEnabled();
function setEnabled(value) {
  isLayoutAnimationEnabled = isLayoutAnimationEnabled;
}
function configureNext(config, onAnimationDidEnd, onAnimationDidFail) {
  var _config$duration;
  if (_Platform.default.isTesting) {
    return;
  }
  if (!isLayoutAnimationEnabled) {
    return;
  }
  var animationCompletionHasRun = false;
  var onAnimationComplete = function onAnimationComplete() {
    if (animationCompletionHasRun) {
      return;
    }
    animationCompletionHasRun = true;
    clearTimeout(raceWithAnimationId);
    onAnimationDidEnd == null ? void 0 : onAnimationDidEnd();
  };
  var raceWithAnimationId = setTimeout(onAnimationComplete, ((_config$duration = config.duration) != null ? _config$duration : 0) + 17);
  var FabricUIManager = (0, _FabricUIManager.getFabricUIManager)();
  if (FabricUIManager != null && FabricUIManager.configureNextLayoutAnimation) {
    var _global, _global$nativeFabricU;
    (_global = global) == null ? void 0 : (_global$nativeFabricU = _global.nativeFabricUIManager) == null ? void 0 : _global$nativeFabricU.configureNextLayoutAnimation(config, onAnimationComplete, onAnimationDidFail != null ? onAnimationDidFail : function () {});
    return;
  }
  if (UIManager != null && UIManager.configureNextLayoutAnimation) {
    UIManager.configureNextLayoutAnimation(config, onAnimationComplete != null ? onAnimationComplete : function () {}, onAnimationDidFail != null ? onAnimationDidFail : function () {});
  }
}
function create(duration, type, property) {
  return {
    duration: duration,
    create: {
      type: type,
      property: property
    },
    update: {
      type: type
    },
    delete: {
      type: type,
      property: property
    }
  };
}
var Presets = {
  easeInEaseOut: create(300, 'easeInEaseOut', 'opacity'),
  linear: create(500, 'linear', 'opacity'),
  spring: {
    duration: 700,
    create: {
      type: 'linear',
      property: 'opacity'
    },
    update: {
      type: 'spring',
      springDamping: 0.4
    },
    delete: {
      type: 'linear',
      property: 'opacity'
    }
  }
};
var LayoutAnimation = {
  configureNext: configureNext,
  create: create,
  Types: Object.freeze({
    spring: 'spring',
    linear: 'linear',
    easeInEaseOut: 'easeInEaseOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    keyboard: 'keyboard'
  }),
  Properties: Object.freeze({
    opacity: 'opacity',
    scaleX: 'scaleX',
    scaleY: 'scaleY',
    scaleXY: 'scaleXY'
  }),
  checkConfig: function checkConfig() {
    console.error('LayoutAnimation.checkConfig(...) has been disabled.');
  },
  Presets: Presets,
  easeInEaseOut: configureNext.bind(null, Presets.easeInEaseOut),
  linear: configureNext.bind(null, Presets.linear),
  spring: configureNext.bind(null, Presets.spring),
  setEnabled: setEnabled
};
module.exports = LayoutAnimation;
//# sourceMappingURL=LayoutAnimation.js.map