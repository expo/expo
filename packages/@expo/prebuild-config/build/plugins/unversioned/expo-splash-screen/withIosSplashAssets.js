"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildContentsJsonImages = buildContentsJsonImages;
exports.withIosSplashAssets = void 0;
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
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _AssetContents() {
  const data = require("../../icons/AssetContents");
  _AssetContents = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug().default)('expo:prebuild-config:expo-splash-screen:ios:assets');
const IMAGE_CACHE_NAME = 'splash-ios';
const IMAGESET_PATH = 'Images.xcassets/SplashScreenLogo.imageset';
const LEGACY_IMAGESET_PATH = 'Images.xcassets/SplashScreenLegacy.imageset';
const PNG_FILENAME = 'image';
const DARK_PNG_FILENAME = 'dark_image';
const TABLET_PNG_FILENAME = 'tablet_image';
const DARK_TABLET_PNG_FILENAME = 'dark_tablet_image';
const withIosSplashAssets = (config, splash) => {
  if (!splash) {
    return config;
  }
  return (0, _configPlugins().withDangerousMod)(config, ['ios', async config => {
    const iosNamedProjectRoot = _configPlugins().IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
    await configureImageAssets({
      projectRoot: config.modRequest.projectRoot,
      iosNamedProjectRoot,
      image: splash.image,
      darkImage: splash.dark?.image,
      tabletImage: splash.tabletImage,
      darkTabletImage: splash.dark?.tabletImage,
      imageWidth: splash.imageWidth ?? 100,
      enableFullScreenImage: splash.enableFullScreenImage_legacy
    });
    return config;
  }]);
};

/**
 * Creates imageset containing image for Splash/Launch Screen.
 */
exports.withIosSplashAssets = withIosSplashAssets;
async function configureImageAssets({
  projectRoot,
  iosNamedProjectRoot,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
  imageWidth,
  enableFullScreenImage
}) {
  const imagePath = enableFullScreenImage ? LEGACY_IMAGESET_PATH : IMAGESET_PATH;
  const imageSetPath = _path().default.resolve(iosNamedProjectRoot, imagePath);

  // remove legacy imageSet if it is not used
  if (!enableFullScreenImage) {
    const legacyImageSetPath = _path().default.resolve(iosNamedProjectRoot, LEGACY_IMAGESET_PATH);
    await _fs().default.promises.rm(legacyImageSetPath, {
      force: true,
      recursive: true
    });
  }

  // ensure old SplashScreen imageSet is removed
  await _fs().default.promises.rm(imageSetPath, {
    force: true,
    recursive: true
  });
  if (!image) {
    return;
  }
  await writeContentsJsonFileAsync({
    assetPath: imageSetPath,
    image: PNG_FILENAME,
    darkImage: darkImage ? DARK_PNG_FILENAME : null,
    tabletImage: tabletImage ? TABLET_PNG_FILENAME : null,
    darkTabletImage: darkTabletImage ? DARK_TABLET_PNG_FILENAME : null
  });
  await copyImageFiles({
    projectRoot,
    iosNamedProjectRoot,
    image,
    darkImage,
    tabletImage,
    darkTabletImage,
    imageWidth,
    enableFullScreenImage
  });
}
async function copyImageFiles({
  projectRoot,
  iosNamedProjectRoot,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
  imageWidth,
  enableFullScreenImage
}) {
  await generateImagesAssetsAsync({
    async generateImageAsset(item, fileName) {
      await Promise.all([{
        ratio: 1,
        suffix: ''
      }, {
        ratio: 2,
        suffix: '@2x'
      }, {
        ratio: 3,
        suffix: '@3x'
      }].map(async ({
        ratio,
        suffix
      }) => {
        const size = imageWidth * ratio;
        // Using this method will cache the images in `.expo` based on the properties used to generate them.
        // this method also supports remote URLs and using the global sharp instance.
        const {
          source
        } = await (0, _imageUtils().generateImageAsync)({
          projectRoot,
          cacheType: IMAGE_CACHE_NAME
        }, {
          src: item,
          width: enableFullScreenImage ? undefined : size,
          height: enableFullScreenImage ? undefined : size
        });
        // Write image buffer to the file system.
        // const assetPath = join(iosNamedProjectRoot, IMAGESET_PATH, filename);
        await _fs().default.promises.writeFile(_path().default.resolve(iosNamedProjectRoot, enableFullScreenImage ? LEGACY_IMAGESET_PATH : IMAGESET_PATH, `${fileName}${suffix}.png`), source);
      }));
    },
    anyItem: image,
    darkItem: darkImage,
    tabletItem: tabletImage,
    darkTabletItem: darkTabletImage
  });
}
async function generateImagesAssetsAsync({
  generateImageAsset,
  anyItem,
  darkItem,
  tabletItem,
  darkTabletItem
}) {
  const items = [[anyItem, PNG_FILENAME], [darkItem, DARK_PNG_FILENAME], [tabletItem, TABLET_PNG_FILENAME], [darkTabletItem, DARK_TABLET_PNG_FILENAME]].filter(([item]) => !!item);
  await Promise.all(items.map(([item, fileName]) => generateImageAsset(item, fileName)));
}
const darkAppearances = [{
  appearance: 'luminosity',
  value: 'dark'
}];
function buildContentsJsonImages({
  image,
  darkImage,
  tabletImage,
  darkTabletImage
}) {
  return [
  // Phone light
  (0, _AssetContents().createContentsJsonItem)({
    idiom: 'universal',
    filename: `${image}.png`,
    scale: '1x'
  }), (0, _AssetContents().createContentsJsonItem)({
    idiom: 'universal',
    filename: `${image}@2x.png`,
    scale: '2x'
  }), (0, _AssetContents().createContentsJsonItem)({
    idiom: 'universal',
    filename: `${image}@3x.png`,
    scale: '3x'
  }),
  // Phone dark
  darkImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'universal',
    appearances: darkAppearances,
    scale: '1x',
    filename: `${darkImage}.png`
  }), darkImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'universal',
    appearances: darkAppearances,
    scale: '2x',
    filename: `${darkImage}@2x.png`
  }), darkImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'universal',
    appearances: darkAppearances,
    scale: '3x',
    filename: `${darkImage}@3x.png`
  }),
  // Tablet light
  tabletImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'ipad',
    filename: `${tabletImage}.png`,
    scale: '1x'
  }), tabletImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'ipad',
    scale: '2x',
    filename: `${tabletImage}@2x.png`
  }),
  // Phone dark
  darkTabletImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'ipad',
    appearances: darkAppearances,
    filename: `${darkTabletImage}.png`,
    scale: '1x'
  }), darkTabletImage && (0, _AssetContents().createContentsJsonItem)({
    idiom: 'ipad',
    appearances: darkAppearances,
    filename: `${darkTabletImage}@2x.png`,
    scale: '2x'
  })].filter(Boolean);
}
async function writeContentsJsonFileAsync({
  assetPath,
  image,
  darkImage,
  tabletImage,
  darkTabletImage
}) {
  const images = buildContentsJsonImages({
    image,
    darkImage,
    tabletImage,
    darkTabletImage
  });
  debug(`create contents.json:`, assetPath);
  debug(`use images:`, images);
  await (0, _AssetContents().writeContentsJsonAsync)(assetPath, {
    images
  });
}
//# sourceMappingURL=withIosSplashAssets.js.map