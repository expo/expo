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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  Colors
} = _configPlugins().AndroidConfig;
const dpiValues = exports.dpiValues = {
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
const ICON_BASELINE_PIXEL_SIZE = 48;
const FOREGROUND_BASELINE_PIXEL_SIZE = 108;
const ANDROID_RES_PATH = exports.ANDROID_RES_PATH = 'android/app/src/main/res/';
const MIPMAP_ANYDPI_V26 = 'mipmap-anydpi-v26';
const ICON_BACKGROUND = 'iconBackground';
const IC_LAUNCHER_WEBP = 'ic_launcher.webp';
const IC_LAUNCHER_ROUND_WEBP = 'ic_launcher_round.webp';
const IC_LAUNCHER_BACKGROUND_WEBP = 'ic_launcher_background.webp';
const IC_LAUNCHER_FOREGROUND_WEBP = 'ic_launcher_foreground.webp';
const IC_LAUNCHER_MONOCHROME_WEBP = 'ic_launcher_monochrome.webp';
const IC_LAUNCHER_XML = 'ic_launcher.xml';
const IC_LAUNCHER_ROUND_XML = 'ic_launcher_round.xml';
const withAndroidIcons = config => {
  const {
    foregroundImage,
    backgroundColor,
    backgroundImage,
    monochromeImage
  } = getAdaptiveIcon(config);
  const icon = foregroundImage ?? getIcon(config);
  if (!icon) {
    return config;
  }
  config = (0, _withAndroidManifestIcons().withAndroidManifestIcons)(config);
  // Apply colors.xml changes
  config = withAndroidAdaptiveIconColors(config, backgroundColor);
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    await setIconAsync(config.modRequest.projectRoot, {
      icon,
      backgroundColor,
      backgroundImage,
      monochromeImage,
      isAdaptive: !!config.android?.adaptiveIcon
    });
    return config;
  }]);
};
exports.withAndroidIcons = withAndroidIcons;
function setRoundIconManifest(config, manifest) {
  const isAdaptive = !!config.android?.adaptiveIcon;
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
    config.modResults = setBackgroundColor(backgroundColor ?? '#ffffff', config.modResults);
    return config;
  });
};
function getIcon(config) {
  return config.android?.icon || config.icon || null;
}
function getAdaptiveIcon(config) {
  return {
    foregroundImage: config.android?.adaptiveIcon?.foregroundImage ?? null,
    backgroundColor: config.android?.adaptiveIcon?.backgroundColor ?? null,
    backgroundImage: config.android?.adaptiveIcon?.backgroundImage ?? null,
    monochromeImage: config.android?.adaptiveIcon?.monochromeImage ?? null
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
  monochromeImage,
  isAdaptive
}) {
  if (!icon) {
    return null;
  }
  await configureLegacyIconAsync(projectRoot, icon, backgroundImage, backgroundColor);
  if (isAdaptive) {
    await generateRoundIconAsync(projectRoot, icon, backgroundImage, backgroundColor);
  } else {
    await deleteIconNamedAsync(projectRoot, IC_LAUNCHER_ROUND_WEBP);
  }
  await configureAdaptiveIconAsync(projectRoot, icon, backgroundImage, backgroundColor, monochromeImage, isAdaptive);
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
    outputImageFileName: IC_LAUNCHER_WEBP,
    imageCacheFolder: 'android-standard-square',
    backgroundImageCacheFolder: 'android-standard-square-background'
  });
}
async function generateRoundIconAsync(projectRoot, icon, backgroundImage, backgroundColor) {
  return generateMultiLayerImageAsync(projectRoot, {
    icon,
    borderRadiusRatio: 0.5,
    outputImageFileName: IC_LAUNCHER_ROUND_WEBP,
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
async function configureAdaptiveIconAsync(projectRoot, foregroundImage, backgroundImage, backgroundColor, monochromeImage, isAdaptive) {
  if (monochromeImage) {
    await generateMonochromeImageAsync(projectRoot, {
      icon: monochromeImage,
      imageCacheFolder: 'android-adaptive-monochrome',
      outputImageFileName: IC_LAUNCHER_MONOCHROME_WEBP
    });
  }
  await generateMultiLayerImageAsync(projectRoot, {
    backgroundColor,
    backgroundImage,
    backgroundImageCacheFolder: 'android-adaptive-background',
    outputImageFileName: IC_LAUNCHER_FOREGROUND_WEBP,
    icon: foregroundImage,
    imageCacheFolder: 'android-adaptive-foreground',
    backgroundImageFileName: IC_LAUNCHER_BACKGROUND_WEBP
  });

  // create ic_launcher.xml and ic_launcher_round.xml
  const icLauncherXmlString = createAdaptiveIconXmlString(backgroundImage, monochromeImage);
  await createAdaptiveIconXmlFiles(projectRoot, icLauncherXmlString,
  // If the user only defined icon and not android.adaptiveIcon, then skip enabling the layering system
  // this will scale the image down and present it uncropped.
  isAdaptive);
}
function setBackgroundColor(backgroundColor, colors) {
  return Colors.assignColorValue(colors, {
    value: backgroundColor,
    name: ICON_BACKGROUND
  });
}
const createAdaptiveIconXmlString = (backgroundImage, monochromeImage) => {
  const background = backgroundImage ? `@drawable/ic_launcher_background` : `@color/iconBackground`;
  const iconElements = [`<background android:drawable="${background}"/>`, '<foreground android:drawable="@mipmap/ic_launcher_foreground"/>'];
  if (monochromeImage) {
    iconElements.push('<monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>');
  }
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    ${iconElements.join('\n    ')}
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
      backgroundColor: backgroundColor ?? 'transparent',
      borderRadiusRatio,
      imageStlye: getImageStyle(outputImageFileName)
    });
    if (backgroundImage) {
      const backgroundLayer = await generateIconAsync(projectRoot, {
        cacheType: backgroundImageCacheFolder,
        src: backgroundImage,
        scale,
        backgroundColor: backgroundColor ?? 'transparent',
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
async function generateMonochromeImageAsync(projectRoot, {
  icon,
  imageCacheFolder,
  outputImageFileName
}) {
  await iterateDpiValues(projectRoot, async ({
    dpiFolder,
    scale
  }) => {
    const monochromeIcon = await generateIconAsync(projectRoot, {
      cacheType: imageCacheFolder,
      src: icon,
      scale,
      backgroundColor: 'transparent'
    });
    await _fsExtra().default.ensureDir(dpiFolder);
    await _fsExtra().default.writeFile(_path().default.resolve(dpiFolder, outputImageFileName), monochromeIcon);
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
  borderRadiusRatio,
  imageStlye
}) {
  const isForegound = imageStlye === 'foreground';
  const baseline = isForegound ? FOREGROUND_BASELINE_PIXEL_SIZE : ICON_BASELINE_PIXEL_SIZE;
  const bgIconSizePx = Math.round(baseline * scale);
  const iconSizePx = Math.round(bgIconSizePx * getImageScale(imageStlye ?? 'background'));
  const {
    source: foreground
  } = await (0, _imageUtils().generateImageAsync)({
    projectRoot,
    cacheType
  }, {
    src,
    resizeMode: 'cover',
    width: iconSizePx,
    height: iconSizePx
  });
  const background = await (0, _imageUtils().generateImageBackgroundAsync)({
    width: bgIconSizePx,
    height: bgIconSizePx,
    backgroundColor: isForegound ? 'transparent' : backgroundColor,
    resizeMode: 'cover',
    borderRadius: borderRadiusRatio ? bgIconSizePx * borderRadiusRatio : undefined
  });
  const x = Math.round((bgIconSizePx - iconSizePx) / 2);
  const y = x;
  return (0, _imageUtils().compositeImagesAsync)({
    background,
    foreground,
    x,
    y
  });
}
function getImageStyle(outputFileName) {
  switch (outputFileName) {
    case IC_LAUNCHER_WEBP:
      return 'legacy';
    case IC_LAUNCHER_BACKGROUND_WEBP:
      return 'background';
    case IC_LAUNCHER_FOREGROUND_WEBP:
      return 'foreground';
    case IC_LAUNCHER_ROUND_WEBP:
      return 'rounded';
    case IC_LAUNCHER_MONOCHROME_WEBP:
      return 'monochrome';
  }
  return 'background';
}
function getImageScale(imageStyle) {
  switch (imageStyle) {
    case 'legacy':
    case 'rounded':
      return 0.9;
    case 'foreground':
    case 'background':
      return 0.7;
    case 'monochrome':
      return 1;
  }
}
//# sourceMappingURL=withAndroidIcons.js.map