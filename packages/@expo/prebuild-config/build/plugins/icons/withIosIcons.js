"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ICON_CONTENTS = void 0;
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
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const {
  getProjectName
} = _configPlugins().IOSConfig.XcodeUtils;
const withIosIcons = config => {
  return (0, _configPlugins().withDangerousMod)(config, ['ios', async config => {
    await setIconsAsync(config, config.modRequest.projectRoot);
    return config;
  }]);
};
exports.withIosIcons = withIosIcons;
const IMAGE_CACHE_NAME = 'icons';
const IMAGESET_PATH = 'Images.xcassets/AppIcon.appiconset';

// Hard-coding seemed like the clearest and safest way to implement the sizes.
const ICON_CONTENTS = [{
  idiom: 'iphone',
  sizes: [{
    size: 20,
    scales: [2, 3]
  }, {
    size: 29,
    scales: [1, 2, 3]
  }, {
    size: 40,
    scales: [2, 3]
  }, {
    size: 60,
    scales: [2, 3]
  }
  // TODO: 76x76@2x seems unused now
  // {
  //   size: 76,
  //   scales: [2],
  // },
  ]
}, {
  idiom: 'ipad',
  sizes: [{
    size: 20,
    scales: [1, 2]
  }, {
    size: 29,
    scales: [1, 2]
  }, {
    size: 40,
    scales: [1, 2]
  }, {
    size: 76,
    scales: [1, 2]
  }, {
    size: 83.5,
    scales: [2]
  }]
}, {
  idiom: 'ios-marketing',
  sizes: [{
    size: 1024,
    scales: [1]
  }]
}];
exports.ICON_CONTENTS = ICON_CONTENTS;
function getIcons(config) {
  var _config$ios;
  // No support for empty strings.
  return ((_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.icon) || config.icon || null;
}
async function setIconsAsync(config, projectRoot) {
  const icon = getIcons(config);
  if (!icon) {
    _configPlugins().WarningAggregator.addWarningIOS('icon', 'This is the image that your app uses on your home screen, you will need to configure it manually.');
    return;
  }

  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs().ensureDir((0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH));

  // Store the image JSON data for assigning via the Contents.json
  const imagesJson = [];

  // keep track of icons that have been generated so we can reuse them in the Contents.json
  const generatedIcons = {};
  for (const platform of ICON_CONTENTS) {
    const isMarketing = platform.idiom === 'ios-marketing';
    for (const {
      size,
      scales
    } of platform.sizes) {
      for (const scale of scales) {
        // The marketing icon is special because it makes no sense.
        const filename = isMarketing ? 'ItunesArtwork@2x.png' : getAppleIconName(size, scale);
        // Only create an image that hasn't already been generated.
        if (!(filename in generatedIcons)) {
          const iconSizePx = size * scale;

          // Using this method will cache the images in `.expo` based on the properties used to generate them.
          // this method also supports remote URLs and using the global sharp instance.
          const {
            source
          } = await (0, _imageUtils().generateImageAsync)({
            projectRoot,
            cacheType: IMAGE_CACHE_NAME
          }, {
            src: icon,
            name: filename,
            width: iconSizePx,
            height: iconSizePx,
            removeTransparency: true,
            // The icon should be square, but if it's not then it will be cropped.
            resizeMode: 'cover',
            // Force the background color to solid white to prevent any transparency.
            // TODO: Maybe use a more adaptive option based on the icon color?
            backgroundColor: '#ffffff'
          });
          // Write image buffer to the file system.
          const assetPath = (0, _path().join)(iosNamedProjectRoot, IMAGESET_PATH, filename);
          await fs().writeFile(assetPath, source);
          // Save a reference to the generated image so we don't create a duplicate.
          generatedIcons[filename] = true;
        }
        imagesJson.push({
          idiom: platform.idiom,
          size: `${size}x${size}`,
          // @ts-ignore: template types not supported in TS yet
          scale: `${scale}x`,
          filename
        });
      }
    }
  }

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
//# sourceMappingURL=withIosIcons.js.map