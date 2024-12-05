"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSplashBackgroundColor = getSplashBackgroundColor;
exports.getSplashDarkBackgroundColor = getSplashDarkBackgroundColor;
exports.removeOldSplashStyleGroup = removeOldSplashStyleGroup;
exports.setSplashColorsForTheme = setSplashColorsForTheme;
exports.setSplashStylesForTheme = setSplashStylesForTheme;
exports.withAndroidSplashStyles = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _android() {
  const data = require("@expo/config-plugins/build/android");
  _android = function () {
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
const styleResourceGroup = {
  name: 'Theme.App.SplashScreen',
  parent: 'Theme.SplashScreen'
};
const SPLASH_COLOR_NAME = 'splashscreen_background';
const withAndroidSplashStyles = (config, {
  splashConfig,
  isLegacyConfig
}) => {
  config = (0, _configPlugins().withAndroidColors)(config, config => {
    const backgroundColor = getSplashBackgroundColor(config, splashConfig);
    if (!backgroundColor) {
      return config;
    }
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = (0, _configPlugins().withAndroidColorsNight)(config, config => {
    const backgroundColor = getSplashDarkBackgroundColor(config, splashConfig);
    if (!backgroundColor) {
      return config;
    }
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = (0, _configPlugins().withAndroidStyles)(config, config => {
    config.modResults = removeOldSplashStyleGroup(config.modResults);
    config.modResults = addSplashScreenStyle(config.modResults, isLegacyConfig, splashConfig?.enableFullScreenImage_legacy ?? false);
    return config;
  });
  return config;
};

// Add the style that extends Theme.SplashScreen
exports.withAndroidSplashStyles = withAndroidSplashStyles;
function addSplashScreenStyle(styles, isLegacyConfig, enableFullScreen) {
  const {
    resources
  } = styles;
  const {
    style = []
  } = resources;
  let item;
  if (isLegacyConfig) {
    item = [{
      $: {
        name: 'android:windowBackground'
      },
      _: '@drawable/ic_launcher_background'
    }];
  } else {
    item = [{
      $: {
        name: 'windowSplashScreenBackground'
      },
      _: '@color/splashscreen_background'
    }, enableFullScreen ? {
      $: {
        name: 'android:windowBackground'
      },
      _: '@drawable/splashscreen_logo'
    } : {
      $: {
        name: 'windowSplashScreenAnimatedIcon'
      },
      _: '@drawable/splashscreen_logo'
    }, {
      $: {
        name: 'postSplashScreenTheme'
      },
      _: '@style/AppTheme'
    }];
  }
  styles.resources.style = [...style.filter(({
    $
  }) => $.name !== 'Theme.App.SplashScreen'), {
    $: {
      ...styleResourceGroup,
      parent: isLegacyConfig ? 'AppTheme' : 'Theme.SplashScreen'
    },
    item
  }];
  return styles;
}

// Remove the old style group which didn't extend the base theme properly.
function removeOldSplashStyleGroup(styles) {
  const group = {
    name: 'Theme.App.SplashScreen',
    parent: 'Theme.AppCompat.Light.NoActionBar'
  };
  styles.resources.style = styles.resources.style?.filter?.(({
    $: head
  }) => {
    let matches = head.name === group.name;
    if (group.parent != null && matches) {
      matches = head.parent === group.parent;
    }
    return !matches;
  });
  return styles;
}
function getSplashBackgroundColor(config, props) {
  return (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config, props)?.backgroundColor ?? null;
}
function getSplashDarkBackgroundColor(config, props) {
  return (0, _getAndroidSplashConfig().getAndroidDarkSplashConfig)(config, props)?.backgroundColor ?? null;
}
function setSplashStylesForTheme(styles) {
  // Add splash screen image
  return _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    value: '@drawable/splashscreen_logo',
    name: 'android:windowSplashScreenBackground',
    parent: styleResourceGroup
  });
}
function setSplashColorsForTheme(colors, backgroundColor) {
  return _android().Colors.assignColorValue(colors, {
    value: backgroundColor,
    name: SPLASH_COLOR_NAME
  });
}
//# sourceMappingURL=withAndroidSplashStyles.js.map