"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withIosSplashColors = exports.SPLASHSCREEN_COLORSET_PATH = void 0;
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
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireWildcard(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _InterfaceBuilder() {
  const data = require("./InterfaceBuilder");
  _InterfaceBuilder = function () {
    return data;
  };
  return data;
}
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug().default)('expo:prebuild-config:expo-splash-screen:ios:splash-colorset');
const SPLASHSCREEN_COLORSET_PATH = exports.SPLASHSCREEN_COLORSET_PATH = 'Images.xcassets/SplashScreenBackground.colorset';
const withIosSplashColors = (config, splash) => {
  if (!splash) {
    return config;
  }
  return (0, _configPlugins().withDangerousMod)(config, ['ios', async config => {
    const iosNamedProjectRoot = _configPlugins().IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
    await configureColorAssets({
      iosNamedProjectRoot,
      backgroundColor: splash.backgroundColor,
      darkBackgroundColor: splash.dark?.backgroundColor
    });
    return config;
  }]);
};
exports.withIosSplashColors = withIosSplashColors;
async function configureColorAssets({
  iosNamedProjectRoot,
  backgroundColor = '#ffffff',
  darkBackgroundColor
}) {
  const colorsetPath = _path().default.resolve(iosNamedProjectRoot, SPLASHSCREEN_COLORSET_PATH);

  // ensure old SplashScreen colorSet is removed
  await _fs().default.promises.rm(colorsetPath, {
    force: true,
    recursive: true
  });
  await writeColorsContentsJsonFileAsync({
    assetPath: colorsetPath,
    backgroundColor,
    darkBackgroundColor: darkBackgroundColor ?? null
  });
}
async function writeColorsContentsJsonFileAsync({
  assetPath,
  backgroundColor,
  darkBackgroundColor
}) {
  const color = (0, _InterfaceBuilder().parseColor)(backgroundColor);
  const darkColor = darkBackgroundColor ? (0, _InterfaceBuilder().parseColor)(darkBackgroundColor) : null;
  const colors = [{
    color: {
      components: {
        alpha: '1.000',
        blue: color.rgb.blue,
        green: color.rgb.green,
        red: color.rgb.red
      },
      'color-space': 'srgb'
    },
    idiom: 'universal'
  }];
  if (darkColor) {
    colors.push({
      color: {
        components: {
          alpha: '1.000',
          blue: darkColor.rgb.blue,
          green: darkColor.rgb.green,
          red: darkColor.rgb.red
        },
        'color-space': 'srgb'
      },
      idiom: 'universal',
      appearances: [{
        appearance: 'luminosity',
        value: 'dark'
      }]
    });
  }
  debug(`create colors contents.json:`, assetPath);
  debug(`use colors:`, colors);
  await writeContentsJsonAsync(assetPath, {
    colors
  });
}
async function writeContentsJsonAsync(directory, {
  colors
}) {
  await _fs().default.promises.mkdir(directory, {
    recursive: true
  });
  await _fs().default.promises.writeFile((0, _path().join)(directory, 'Contents.json'), JSON.stringify({
    colors,
    info: {
      version: 1,
      // common practice is for the tool that generated the icons to be the "author"
      author: 'expo'
    }
  }, null, 2), 'utf8');
}
//# sourceMappingURL=withIosSplashColors.js.map