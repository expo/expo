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
function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));
  _fsExtra = function () {
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
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// @ts-ignore

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
  await _fsExtra().default.remove(colorsetPath);
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
  await _fsExtra().default.ensureDir(directory);
  await _fsExtra().default.writeFile((0, _path().join)(directory, 'Contents.json'), JSON.stringify({
    colors,
    info: {
      version: 1,
      // common practice is for the tool that generated the icons to be the "author"
      author: 'expo'
    }
  }, null, 2));
}
//# sourceMappingURL=withIosSplashColors.js.map