"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSplashScreenLegacyMainActivity = setSplashScreenLegacyMainActivity;
exports.withAndroidSplashLegacyMainActivity = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _codeMod() {
  const data = require("@expo/config-plugins/build/android/codeMod");
  _codeMod = function () {
    return data;
  };
  return data;
}
function _generateCode() {
  const data = require("@expo/config-plugins/build/utils/generateCode");
  _generateCode = function () {
    return data;
  };
  return data;
}
function _debug() {
  const data = _interopRequireDefault(require("debug"));
  _debug = function () {
    return data;
  };
  return data;
}
function _getAndroidSplashConfig() {
  const data = require("./getAndroidSplashConfig");
  _getAndroidSplashConfig = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug().default)('expo:prebuild-config:expo-splash-screen:android:mainActivity');

// DO NOT CHANGE
const SHOW_SPLASH_ID = 'expo-splash-screen-mainActivity-onCreate-show-splash';
const withAndroidSplashLegacyMainActivity = (config, props) => {
  return (0, _configPlugins().withMainActivity)(config, config => {
    config.modResults.contents = setSplashScreenLegacyMainActivity(config, props, config.modResults.contents, config.modResults.language);
    return config;
  });
};
exports.withAndroidSplashLegacyMainActivity = withAndroidSplashLegacyMainActivity;
function setSplashScreenLegacyMainActivity(config, props, mainActivity, language) {
  debug(`Modify with language: "${language}"`);
  const splashConfig = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config, props);
  if (!splashConfig) {
    // Remove our generated code safely...
    const mod = (0, _generateCode().removeContents)({
      src: mainActivity,
      tag: SHOW_SPLASH_ID
    });
    mainActivity = mod.contents;
    if (mod.didClear) {
      debug('Removed SplashScreen.show()');
    }
    return mainActivity;
  }
  // TODO: Translucent is weird
  const statusBarTranslucent = !!config.androidStatusBar?.translucent;
  const {
    resizeMode
  } = splashConfig;
  const isJava = language === 'java';
  const LE = isJava ? ';' : '';
  mainActivity = (0, _codeMod().addImports)(mainActivity, ['host.exp.exponent.experience.splashscreen.legacy.singletons.SplashScreen', 'host.exp.exponent.experience.splashscreen.legacy.SplashScreenImageResizeMode', 'com.facebook.react.ReactRootView', 'android.os.Bundle'], isJava);
  if (!mainActivity.match(/(?<=^.*super\.onCreate.*$)/m)) {
    const onCreateBlock = isJava ? ['    @Override', '    protected void onCreate(Bundle savedInstanceState) {', '      super.onCreate(savedInstanceState);', '    }'] : ['    override fun onCreate(savedInstanceState: Bundle?) {', '      super.onCreate(savedInstanceState)', '    }'];
    mainActivity = (0, _generateCode().mergeContents)({
      src: mainActivity,
      // insert just below super.onCreate
      anchor: isJava ? /(?<=public\s+class\s+.*\s+extends\s+.*\s+{.*$)/m : /(?<=class\s+.*\s+:\s+.*\s+{.*$)/m,
      offset: 1,
      comment: '//',
      tag: 'expo-splash-screen-mainActivity-onCreate',
      newSrc: onCreateBlock.join('\n')
    }).contents;
  }

  // Remove our generated code safely...
  mainActivity = (0, _generateCode().removeContents)({
    src: mainActivity,
    tag: SHOW_SPLASH_ID
  }).contents;

  // Remove code from `@expo/configure-splash-screen`
  mainActivity = mainActivity.split('\n').filter(line => {
    return !/SplashScreen\.show\(this,\s?SplashScreenImageResizeMode\./.test(line);
  }).join('\n');

  // Reapply generated code.
  mainActivity = (0, _generateCode().mergeContents)({
    src: mainActivity,
    // insert just below super.onCreate
    anchor: /(?<=^.*super\.onCreate.*$)/m,
    offset: 1,
    comment: '//',
    tag: SHOW_SPLASH_ID,
    newSrc: `    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView${isJava ? '.class' : '::class.java'}, ${statusBarTranslucent})${LE}`
  }).contents;

  // TODO: Remove old `SplashScreen.show`

  return mainActivity;
}
//# sourceMappingURL=withAndroidSplashLegacyMainActivity.js.map