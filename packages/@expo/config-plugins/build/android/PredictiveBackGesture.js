"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPredictiveBackGestureValue = getPredictiveBackGestureValue;
exports.setPredictiveBackGesture = setPredictiveBackGesture;
exports.withPredictiveBackGesture = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const ANDROID_ENABLE_ON_BACK_INVOKED_CALLBACK = 'android:enableOnBackInvokedCallback';
const withPredictiveBackGesture = config => {
  return (0, _androidPlugins().withAndroidManifest)(config, async config => {
    config.modResults = setPredictiveBackGesture(config, config.modResults);
    return config;
  });
};
exports.withPredictiveBackGesture = withPredictiveBackGesture;
function setPredictiveBackGesture(config, androidManifest) {
  const app = (0, _Manifest().getMainApplicationOrThrow)(androidManifest);
  app.$[ANDROID_ENABLE_ON_BACK_INVOKED_CALLBACK] = getPredictiveBackGestureValue(config);
  return androidManifest;
}
function getPredictiveBackGestureValue(config) {
  const value = config.android?.predictiveBackGestureEnabled;
  return value === true ? 'true' : 'false';
}
//# sourceMappingURL=PredictiveBackGesture.js.map