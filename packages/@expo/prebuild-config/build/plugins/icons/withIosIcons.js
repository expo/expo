"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateUniversalIconAsync = generateUniversalIconAsync;
exports.getIcons = getIcons;
exports.setIconsAsync = setIconsAsync;
exports.withIosIcons = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _imageUtils() {
  const data = require("@expo/image-utils");
  _imageUtils = function () {
    return data;
  };
  return data;
}
function fs() {
  const data = _interopRequireWildcard(require("fs-extra"));
  fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = require("path");
  _path = function () {
    return data;
  };
  return data;
}
function _AssetContents() {
  const data = require("./AssetContents");
  _AssetContents = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const {
  getProjectName
} = _configPlugins().IOSConfig.XcodeUtils;
const IMAGE_CACHE_NAME = 'icons';
const IMAGESET_PATH = 'Images.xcassets/AppIcon.appiconset';
const withIosIcons = config => {
  return (0, _configPlugins().withDangerousMod)(config, ['ios', async config => {
    await setIconsAsync(config, config.modRequest.projectRoot);
    return config;
  }]);
};
exports.withIosIcons = withIosIcons;
function getIcons(config) {
  // No support for empty strings.
  return config.ios?.icon || config.icon || null;
}
async function setIconsAsync(config, projectRoot) {
  const icon = getIcons(config);
  if (!icon) {
    _configPlugins().WarningAggregator.addWarningIOS('icon', 'No icon is defined in the Expo config.');
  }
  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs().ensureDir((0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH));

  // Store the image JSON data for assigning via the Contents.json
  const imagesJson = await generateUniversalIconAsync(projectRoot, {
    icon,
    cacheKey: 'universal-icon',
    iosNamedProjectRoot,
    platform: 'ios'
  });

  // Finally, write the Config.json
  await (0, _AssetContents().writeContentsJsonAsync)((0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH), {
    images: imagesJson
  });
}

/**
 * Return the project's named iOS path: ios/MyProject/
 *
 * @param projectRoot Expo project root path.
 */
function getIosNamedProjectPath(projectRoot) {
  const projectName = getProjectName(projectRoot);
  return (0, _path().join)(projectRoot, 'ios', projectName);
}
function getAppleIconName(size, scale) {
  return `App-Icon-${size}x${size}@${scale}x.png`;
}
async function generateUniversalIconAsync(projectRoot, {
  icon,
  cacheKey,
  iosNamedProjectRoot,
  platform
}) {
  const size = 1024;
  const filename = getAppleIconName(size, 1);
  let source;
  if (icon) {
    // Using this method will cache the images in `.expo` based on the properties used to generate them.
    // this method also supports remote URLs and using the global sharp instance.
    source = (await (0, _imageUtils().generateImageAsync)({
      projectRoot,
      cacheType: IMAGE_CACHE_NAME + cacheKey
    }, {
      src: icon,
      name: filename,
      width: size,
      height: size,
      removeTransparency: true,
      // The icon should be square, but if it's not then it will be cropped.
      resizeMode: 'cover',
      // Force the background color to solid white to prevent any transparency.
      // TODO: Maybe use a more adaptive option based on the icon color?
      backgroundColor: '#ffffff'
    })).source;
  } else {
    // Create a white square image if no icon exists to mitigate the chance of a submission failure to the app store.
    source = await (0, _imageUtils().createSquareAsync)({
      size
    });
  }
  // Write image buffer to the file system.
  const assetPath = (0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH, filename);
  await fs().writeFile(assetPath, source);
  return [{
    filename: getAppleIconName(size, 1),
    idiom: 'universal',
    platform,
    size: `${size}x${size}`
  }];
}
//# sourceMappingURL=withIosIcons.js.map