"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSplashInfoPlist = setSplashInfoPlist;
exports.withIosSplashInfoPlist = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = (0, _debug().default)('expo:prebuild-config:expo-splash-screen:ios:infoPlist');
const withIosSplashInfoPlist = (config, splash) => {
  return (0, _configPlugins().withInfoPlist)(config, config => {
    config.modResults = setSplashInfoPlist(config, config.modResults, splash);
    return config;
  });
};
exports.withIosSplashInfoPlist = withIosSplashInfoPlist;
function setSplashInfoPlist(config, infoPlist, splash) {
  var _splash$dark, _splash$dark2, _splash$dark3, _splash$dark4;
  infoPlist['EXSplashScreenFadeTime'] = splash.fadeTime;
  const isDarkModeEnabled = !!(splash !== null && splash !== void 0 && (_splash$dark = splash.dark) !== null && _splash$dark !== void 0 && _splash$dark.image || splash !== null && splash !== void 0 && (_splash$dark2 = splash.dark) !== null && _splash$dark2 !== void 0 && _splash$dark2.tabletImage || splash !== null && splash !== void 0 && (_splash$dark3 = splash.dark) !== null && _splash$dark3 !== void 0 && _splash$dark3.backgroundColor || splash !== null && splash !== void 0 && (_splash$dark4 = splash.dark) !== null && _splash$dark4 !== void 0 && _splash$dark4.tabletBackgroundColor);
  debug(`isDarkModeEnabled: `, isDarkModeEnabled);
  if (isDarkModeEnabled) {
    var _config$ios$userInter, _config$ios;
    // IOSConfig.UserInterfaceStyle.getUserInterfaceStyle(config);
    // Determine if the user manually defined the userInterfaceStyle incorrectly
    const existing = (_config$ios$userInter = (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.userInterfaceStyle) !== null && _config$ios$userInter !== void 0 ? _config$ios$userInter : config.userInterfaceStyle;
    // Add a warning to prevent the dark mode splash screen from not being shown -- this was learned the hard way.
    if (existing && existing !== 'automatic') {
      _configPlugins().WarningAggregator.addWarningIOS('userInterfaceStyle', 'The existing `userInterfaceStyle` property is preventing splash screen from working properly. Please remove it or disable dark mode splash screens.');
    }
    // assigning it to auto anyways, but this is fragile because the order of operations matter now
    infoPlist.UIUserInterfaceStyle = 'Automatic';
  } else {
    // NOTE(brentvatne): Commented out this line because it causes https://github.com/expo/expo-cli/issues/3935
    // We should revisit this approach.
    // delete infoPlist.UIUserInterfaceStyle;
  }
  if (splash) {
    // TODO: What to do here ??
    infoPlist.UILaunchStoryboardName = 'SplashScreen';
  } else {
    debug(`Disabling UILaunchStoryboardName`);
    delete infoPlist.UILaunchStoryboardName;
  }
  return infoPlist;
}
//# sourceMappingURL=withIosSplashInfoPlist.js.map