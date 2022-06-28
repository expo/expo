"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ANDROID_RES_PATH = void 0;
exports.configureAdaptiveIconAsync = configureAdaptiveIconAsync;
exports.dpiValues = exports.createAdaptiveIconXmlString = void 0;
exports.getAdaptiveIcon = getAdaptiveIcon;
exports.getIcon = getIcon;
exports.setIconAsync = setIconAsync;
exports.setRoundIconManifest = setRoundIconManifest;
exports.withAndroidIcons = void 0;

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

function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));

  _fsExtra = function () {
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

function _withAndroidManifestIcons() {
  const data = require("./withAndroidManifestIcons");

  _withAndroidManifestIcons = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  Colors
} = _configPlugins().AndroidConfig;

const dpiValues = {
  mdpi: {
    folderName: 'mipmap-mdpi',
    scale: 1
  },
  hdpi: {
    folderName: 'mipmap-hdpi',
    scale: 1.5
  },
  xhdpi: {
    folderName: 'mipmap-xhdpi',
    scale: 2
  },
  xxhdpi: {
    folderName: 'mipmap-xxhdpi',
    scale: 3
  },
  xxxhdpi: {
    folderName: 'mipmap-xxxhdpi',
    scale: 4
  }
};
exports.dpiValues = dpiValues;
const BASELINE_PIXEL_SIZE = 48;
const ANDROID_RES_PATH = 'android/app/src/main/res/';
exports.ANDROID_RES_PATH = ANDROID_RES_PATH;
const MIPMAP_ANYDPI_V26 = 'mipmap-anydpi-v26';
const ICON_BACKGROUND = 'iconBackground';
const IC_LAUNCHER_PNG = 'ic_launcher.png';
const IC_LAUNCHER_ROUND_PNG = 'ic_launcher_round.png';
const IC_LAUNCHER_BACKGROUND_PNG = 'ic_launcher_background.png';
const IC_LAUNCHER_FOREGROUND_PNG = 'ic_launcher_foreground.png';
const IC_LAUNCHER_XML = 'ic_launcher.xml';
const IC_LAUNCHER_ROUND_XML = 'ic_launcher_round.xml';

const withAndroidIcons = config => {
  const {
    foregroundImage,
    backgroundColor,
    backgroundImage
  } = getAdaptiveIcon(config);
  const icon = foregroundImage !== null && foregroundImage !== void 0 ? foregroundImage : getIcon(config);

  if (!icon) {
    return config;
  }

  config = (0, _withAndroidManifestIcons().withAndroidManifestIcons)(config); // Apply colors.xml changes

  config = withAndroidAdaptiveIconColors(config, backgroundColor);
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    var _config$android;

    await setIconAsync(config.modRequest.projectRoot, {
      icon,
      backgroundColor,
      backgroundImage,
      isAdaptive: !!((_config$android = config.android) !== null && _config$android !== void 0 && _config$android.adaptiveIcon)
    });
    return config;
  }]);
};

exports.withAndroidIcons = withAndroidIcons;

function setRoundIconManifest(config, manifest) {
  var _config$android2;

  const isAdaptive = !!((_config$android2 = config.android) !== null && _config$android2 !== void 0 && _config$android2.adaptiveIcon);

  const application = _configPlugins().AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  if (isAdaptive) {
    application.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
  } else {
    delete application.$['android:roundIcon'];
  }

  return manifest;
}

const withAndroidAdaptiveIconColors = (config, backgroundColor) => {
  return (0, _configPlugins().withAndroidColors)(config, config => {
    config.modResults = setBackgroundColor(backgroundColor !== null && backgroundColor !== void 0 ? backgroundColor : '#FFFFFF', config.modResults);
    return config;
  });
};

function getIcon(config) {
  var _config$android3;

  return ((_config$android3 = config.android) === null || _config$android3 === void 0 ? void 0 : _config$android3.icon) || config.icon || null;
}

function getAdaptiveIcon(config) {
  var _config$android$adapt, _config$android4, _config$android4$adap, _config$android$adapt2, _config$android5, _config$android5$adap, _config$android$adapt3, _config$android6, _config$android6$adap;

  return {
    foregroundImage: (_config$android$adapt = (_config$android4 = config.android) === null || _config$android4 === void 0 ? void 0 : (_config$android4$adap = _config$android4.adaptiveIcon) === null || _config$android4$adap === void 0 ? void 0 : _config$android4$adap.foregroundImage) !== null && _config$android$adapt !== void 0 ? _config$android$adapt : null,
    backgroundColor: (_config$android$adapt2 = (_config$android5 = config.android) === null || _config$android5 === void 0 ? void 0 : (_config$android5$adap = _config$android5.adaptiveIcon) === null || _config$android5$adap === void 0 ? void 0 : _config$android5$adap.backgroundColor) !== null && _config$android$adapt2 !== void 0 ? _config$android$adapt2 : null,
    backgroundImage: (_config$android$adapt3 = (_config$android6 = config.android) === null || _config$android6 === void 0 ? void 0 : (_config$android6$adap = _config$android6.adaptiveIcon) === null || _config$android6$adap === void 0 ? void 0 : _config$android6$adap.backgroundImage) !== null && _config$android$adapt3 !== void 0 ? _config$android$adapt3 : null
  };
}
/**
 * Resizes the user-provided icon to create a set of legacy icon files in
 * their respective "mipmap" directories for <= Android 7, and creates a set of adaptive
 * icon files for > Android 7 from the adaptive icon files (if provided).
 */


async function setIconAsync(projectRoot, {
  icon,
  backgroundColor,
  backgroundImage,
  isAdaptive
}) {
  if (!icon) {
    return null;
  }

  await configureLegacyIconAsync(projectRoot, icon, backgroundImage, backgroundColor);

  if (isAdaptive) {
    await generateRoundIconAsync(projectRoot, icon, backgroundImage, backgroundColor);
  } else {
    await deleteIconNamedAsync(projectRoot, IC_LAUNCHER_ROUND_PNG);
  }

  await configureAdaptiveIconAsync(projectRoot, icon, backgroundImage, isAdaptive);
  return true;
}
/**
 * Configures legacy icon files to be used on Android 7 and earlier. If adaptive icon configuration
 * was provided, we create a pseudo-adaptive icon by layering the provided files (or background
 * color if no backgroundImage is provided. If no backgroundImage and no backgroundColor are provided,
 * the background is set to transparent.)
 */


async function configureLegacyIconAsync(projectRoot, icon, backgroundImage, backgroundColor) {
  return generateMultiLayerImageAsync(projectRoot, {
    icon,
    backgroundImage,
    backgroundColor,
    outputImageFileName: IC_LAUNCHER_PNG,
    imageCacheFolder: 'android-standard-square',
    backgroundImageCacheFolder: 'android-standard-square-background'
  });
}

async function generateRoundIconAsync(projectRoot, icon, backgroundImage, backgroundColor) {
  return generateMultiLayerImageAsync(projectRoot, {
    icon,
    borderRadiusRatio: 0.5,
    outputImageFileName: IC_LAUNCHER_ROUND_PNG,
    backgroundImage,
    backgroundColor,
    imageCacheFolder: 'android-standard-circle',
    backgroundImageCacheFolder: 'android-standard-round-background'
  });
}
/**
 * Configures adaptive icon files to be used on Android 8 and up. A foreground image must be provided,
 * and will have a transparent background unless:
 * - A backgroundImage is provided, or
 * - A backgroundColor was specified
 */


async function configureAdaptiveIconAsync(projectRoot, foregroundImage, backgroundImage, isAdaptive) {
  await generateMultiLayerImageAsync(projectRoot, {
    backgroundColor: 'transparent',
    backgroundImage,
    backgroundImageCacheFolder: 'android-adaptive-background',
    outputImageFileName: IC_LAUNCHER_FOREGROUND_PNG,
    icon: foregroundImage,
    imageCacheFolder: 'android-adaptive-foreground',
    backgroundImageFileName: IC_LAUNCHER_BACKGROUND_PNG
  }); // create ic_launcher.xml and ic_launcher_round.xml

  const icLauncherXmlString = createAdaptiveIconXmlString(backgroundImage);
  await createAdaptiveIconXmlFiles(projectRoot, icLauncherXmlString, // If the user only defined icon and not android.adaptiveIcon, then skip enabling the layering system
  // this will scale the image down and present it uncropped.
  isAdaptive);
}

function setBackgroundColor(backgroundColor, colors) {
  return Colors.assignColorValue(colors, {
    value: backgroundColor,
    name: ICON_BACKGROUND
  });
}

const createAdaptiveIconXmlString = backgroundImage => {
  const background = backgroundImage ? `@mipmap/ic_launcher_background` : `@color/iconBackground`;
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="${background}"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
};

exports.createAdaptiveIconXmlString = createAdaptiveIconXmlString;

async function createAdaptiveIconXmlFiles(projectRoot, icLauncherXmlString, add) {
  const anyDpiV26Directory = _path().default.resolve(projectRoot, ANDROID_RES_PATH, MIPMAP_ANYDPI_V26);

  await _fsExtra().default.ensureDir(anyDpiV26Directory);

  const launcherPath = _path().default.resolve(anyDpiV26Directory, IC_LAUNCHER_XML);

  const launcherRoundPath = _path().default.resolve(anyDpiV26Directory, IC_LAUNCHER_ROUND_XML);

  if (add) {
    await Promise.all([_fsExtra().default.writeFile(launcherPath, icLauncherXmlString), _fsExtra().default.writeFile(launcherRoundPath, icLauncherXmlString)]);
  } else {
    // Remove the xml if the icon switches from adaptive to standard.
    await Promise.all([launcherPath, launcherRoundPath].map(async path => {
      if (_fsExtra().default.existsSync(path)) {
        return _fsExtra().default.remove(path);
      }
    }));
  }
}

async function generateMultiLayerImageAsync(projectRoot, {
  icon,
  backgroundColor,
  backgroundImage,
  imageCacheFolder,
  backgroundImageCacheFolder,
  borderRadiusRatio,
  outputImageFileName,
  backgroundImageFileName
}) {
  await iterateDpiValues(projectRoot, async ({
    dpiFolder,
    scale
  }) => {
    let iconLayer = await generateIconAsync(projectRoot, {
      cacheType: imageCacheFolder,
      src: icon,
      scale,
      // backgroundImage overrides backgroundColor
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor !== null && backgroundColor !== void 0 ? backgroundColor : 'transparent',
      borderRadiusRatio
    });

    if (backgroundImage) {
      const backgroundLayer = await generateIconAsync(projectRoot, {
        cacheType: backgroundImageCacheFolder,
        src: backgroundImage,
        scale,
        backgroundColor: 'transparent',
        borderRadiusRatio
      });

      if (backgroundImageFileName) {
        await _fsExtra().default.writeFile(_path().default.resolve(dpiFolder, backgroundImageFileName), backgroundLayer);
      } else {
        iconLayer = await (0, _imageUtils().compositeImagesAsync)({
          foreground: iconLayer,
          background: backgroundLayer
        });
      }
    } else if (backgroundImageFileName) {
      // Remove any instances of ic_launcher_background.png that are there from previous icons
      await deleteIconNamedAsync(projectRoot, backgroundImageFileName);
    }

    await _fsExtra().default.ensureDir(dpiFolder);
    await _fsExtra().default.writeFile(_path().default.resolve(dpiFolder, outputImageFileName), iconLayer);
  });
}

function iterateDpiValues(projectRoot, callback) {
  return Promise.all(Object.values(dpiValues).map(value => callback({
    dpiFolder: _path().default.resolve(projectRoot, ANDROID_RES_PATH, value.folderName),
    ...value
  })));
}

async function deleteIconNamedAsync(projectRoot, name) {
  return iterateDpiValues(projectRoot, ({
    dpiFolder
  }) => {
    return _fsExtra().default.remove(_path().default.resolve(dpiFolder, name));
  });
}

async function generateIconAsync(projectRoot, {
  cacheType,
  src,
  scale,
  backgroundColor,
  borderRadiusRatio
}) {
  const iconSizePx = BASELINE_PIXEL_SIZE * scale;
  return (await (0, _imageUtils().generateImageAsync)({
    projectRoot,
    cacheType
  }, {
    src,
    width: iconSizePx,
    height: iconSizePx,
    resizeMode: 'cover',
    backgroundColor,
    borderRadius: borderRadiusRatio ? iconSizePx * borderRadiusRatio : undefined
  })).source;
}
//# sourceMappingURL=withAndroidIcons.js.map