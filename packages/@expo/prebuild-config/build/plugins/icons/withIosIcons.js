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
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
  const iosSpecificIcons = config.ios?.icon;
  if (iosSpecificIcons) {
    // For backwards compatibility, the icon can be a string
    if (typeof iosSpecificIcons === 'string') {
      return iosSpecificIcons || config.icon || null;
    }

    // in iOS 18 introduced the ability to specify dark and tinted icons, which users can specify as an object
    if (!iosSpecificIcons.light && !iosSpecificIcons.dark && !iosSpecificIcons.tinted) {
      return config.icon || null;
    }
    return iosSpecificIcons;
  }
  if (config.icon) {
    return config.icon;
  }
  return null;
}
async function setIconsAsync(config, projectRoot) {
  const icon = getIcons(config);
  if (!icon || typeof icon === 'string' && !icon || typeof icon === 'object' && !icon?.light && !icon?.dark && !icon?.tinted) {
    _configPlugins().WarningAggregator.addWarningIOS('icon', 'No icon is defined in the Expo config.');
  }

  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await _fs().default.promises.mkdir((0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH), {
    recursive: true
  });
  const imagesJson = [];
  const baseIconPath = typeof icon === 'object' ? icon?.light || icon?.dark || icon?.tinted : icon;

  // Store the image JSON data for assigning via the Contents.json
  const baseIcon = await generateUniversalIconAsync(projectRoot, {
    icon: baseIconPath,
    cacheKey: 'universal-icon',
    iosNamedProjectRoot,
    platform: 'ios'
  });
  imagesJson.push(baseIcon);
  if (typeof icon === 'object') {
    if (icon?.dark) {
      const darkIcon = await generateUniversalIconAsync(projectRoot, {
        icon: icon.dark,
        cacheKey: 'universal-icon-dark',
        iosNamedProjectRoot,
        platform: 'ios',
        appearance: 'dark'
      });
      imagesJson.push(darkIcon);
    }
    if (icon?.tinted) {
      const tintedIcon = await generateUniversalIconAsync(projectRoot, {
        icon: icon.tinted,
        cacheKey: 'universal-icon-tinted',
        iosNamedProjectRoot,
        platform: 'ios',
        appearance: 'tinted'
      });
      imagesJson.push(tintedIcon);
    }
  }

  // Finally, write the Contents.json
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
function getAppleIconName(size, scale, appearance) {
  let name = 'App-Icon';
  if (appearance) {
    name = `${name}-${appearance}`;
  }
  name = `${name}-${size}x${size}@${scale}x.png`;
  return name;
}
async function generateUniversalIconAsync(projectRoot, {
  icon,
  cacheKey,
  iosNamedProjectRoot,
  platform,
  appearance
}) {
  const size = 1024;
  const filename = getAppleIconName(size, 1, appearance);
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
      // Transparency needs to be preserved in dark variant, but can safely be removed in "light" and "tinted" variants.
      removeTransparency: appearance !== 'dark',
      // The icon should be square, but if it's not then it will be cropped.
      resizeMode: 'cover',
      // Force the background color to solid white to prevent any transparency. (for "any" and "tinted" variants)
      // TODO: Maybe use a more adaptive option based on the icon color?
      backgroundColor: appearance !== 'dark' ? '#ffffff' : undefined
    })).source;
  } else {
    // Create a white square image if no icon exists to mitigate the chance of a submission failure to the app store.
    source = await (0, _imageUtils().createSquareAsync)({
      size
    });
  }
  // Write image buffer to the file system.
  const assetPath = (0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH, filename);
  await _fs().default.promises.writeFile(assetPath, source);
  return {
    filename,
    idiom: 'universal',
    platform,
    size: `${size}x${size}`,
    ...(appearance ? {
      appearances: [{
        appearance: 'luminosity',
        value: appearance
      }]
    } : {})
  };
}
//# sourceMappingURL=withIosIcons.js.map