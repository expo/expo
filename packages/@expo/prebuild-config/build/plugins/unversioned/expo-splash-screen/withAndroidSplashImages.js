"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSplashImageDrawablesAsync = setSplashImageDrawablesAsync;
exports.setSplashImageDrawablesForThemeAsync = setSplashImageDrawablesForThemeAsync;
exports.withAndroidSplashImages = void 0;
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
function _getAndroidSplashConfig() {
  const data = require("./getAndroidSplashConfig");
  _getAndroidSplashConfig = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_logo.png';
const SPLASH_SCREEN_DRAWABLE_NAME = 'splashscreen_logo.xml';
const DRAWABLES_CONFIGS = {
  default: {
    modes: {
      light: {
        path: `./res/drawable/${SPLASH_SCREEN_DRAWABLE_NAME}`
      },
      dark: {
        path: `./res/drawable-night/${SPLASH_SCREEN_DRAWABLE_NAME}`
      }
    },
    dimensionsMultiplier: 1
  },
  mdpi: {
    modes: {
      light: {
        path: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`
      },
      dark: {
        path: `./res/drawable-night-mdpi/${SPLASH_SCREEN_FILENAME}`
      }
    },
    dimensionsMultiplier: 1
  },
  hdpi: {
    modes: {
      light: {
        path: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`
      },
      dark: {
        path: `./res/drawable-night-hdpi/${SPLASH_SCREEN_FILENAME}`
      }
    },
    dimensionsMultiplier: 1.5
  },
  xhdpi: {
    modes: {
      light: {
        path: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`
      },
      dark: {
        path: `./res/drawable-night-xhdpi/${SPLASH_SCREEN_FILENAME}`
      }
    },
    dimensionsMultiplier: 2
  },
  xxhdpi: {
    modes: {
      light: {
        path: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`
      },
      dark: {
        path: `./res/drawable-night-xxhdpi/${SPLASH_SCREEN_FILENAME}`
      }
    },
    dimensionsMultiplier: 3
  },
  xxxhdpi: {
    modes: {
      light: {
        path: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`
      },
      dark: {
        path: `./res/drawable-night-xxxhdpi/${SPLASH_SCREEN_FILENAME}`
      }
    },
    dimensionsMultiplier: 4
  }
};
const withAndroidSplashImages = (config, splash) => {
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    if (splash) {
      await setSplashImageDrawablesAsync(config, splash, config.modRequest.projectRoot, splash?.imageWidth ?? 200);
    }
    return config;
  }]);
};

/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 *
 * @param androidMainPath Absolute path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 */
exports.withAndroidSplashImages = withAndroidSplashImages;
async function setSplashImageDrawablesAsync(config, props, projectRoot, imageWidth) {
  await clearAllExistingSplashImagesAsync(projectRoot);
  const splash = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config, props);
  const darkSplash = (0, _getAndroidSplashConfig().getAndroidDarkSplashConfig)(config, props);
  await Promise.all([setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot, imageWidth), setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot, imageWidth)]);
}
async function clearAllExistingSplashImagesAsync(projectRoot) {
  const androidMainPath = _path().default.join(projectRoot, 'android/app/src/main');
  await Promise.all(Object.values(DRAWABLES_CONFIGS).map(async ({
    modes
  }) => {
    await Promise.all(Object.values(modes).map(async ({
      path: filePath
    }) => {
      if (await _fsExtra().default.pathExists(_path().default.resolve(androidMainPath, filePath))) {
        await _fsExtra().default.remove(_path().default.resolve(androidMainPath, filePath));
      }
    }));
  }));
}
async function setSplashImageDrawablesForThemeAsync(config, theme, projectRoot, imageWidth = 100) {
  if (!config) return;
  const androidMainPath = _path().default.join(projectRoot, 'android/app/src/main');
  if (config.drawable) {
    await writeSplashScreenDrawablesAsync(androidMainPath, projectRoot, config.drawable);
    return;
  }
  const sizes = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  await Promise.all(sizes.map(async imageKey => {
    // @ts-ignore
    const image = config[imageKey];
    if (image) {
      const multiplier = DRAWABLES_CONFIGS[imageKey].dimensionsMultiplier;
      const size = imageWidth * multiplier; // "imageWidth" must be replaced by the logo width chosen by the user in its config file
      const canvasSize = 288 * multiplier;
      const background = await (0, _imageUtils().generateImageBackgroundAsync)({
        width: canvasSize,
        height: canvasSize,
        backgroundColor: config.backgroundColor ?? 'transparent',
        resizeMode: 'cover'
      });
      const {
        source: foreground
      } = await (0, _imageUtils().generateImageAsync)({
        projectRoot,
        cacheType: IMAGE_CACHE_NAME
      }, {
        src: image,
        resizeMode: 'contain',
        width: size,
        height: size
      });
      const composedImage = await (0, _imageUtils().compositeImagesAsync)({
        background,
        foreground,
        x: (canvasSize - size) / 2,
        y: (canvasSize - size) / 2
      });

      // Get output path for drawable.
      const outputPath = _path().default.join(androidMainPath, DRAWABLES_CONFIGS[imageKey].modes[theme].path);
      const folder = _path().default.dirname(outputPath);
      // Ensure directory exists.
      await _fsExtra().default.ensureDir(folder);
      await _fsExtra().default.writeFile(outputPath, composedImage);
    }
    return null;
  }));
}
async function writeSplashScreenDrawablesAsync(drawablePath, projectRoot, drawable) {
  if (!drawable) {
    return;
  }
  const lightDrawablePath = _path().default.join(drawablePath, DRAWABLES_CONFIGS.default.modes.light.path);
  const darkDrawablePath = _path().default.join(drawablePath, DRAWABLES_CONFIGS.default.modes.dark.path);
  const lightFolder = _path().default.dirname(lightDrawablePath);
  await _fsExtra().default.ensureDir(lightFolder);
  await _fsExtra().default.copyFile(_path().default.join(projectRoot, drawable.icon), lightDrawablePath);
  if (drawable.darkIcon) {
    const darkFolder = _path().default.dirname(darkDrawablePath);
    await _fsExtra().default.ensureDir(darkFolder);
    await _fsExtra().default.copyFile(_path().default.join(projectRoot, drawable.darkIcon), darkDrawablePath);
  }
}
//# sourceMappingURL=withAndroidSplashImages.js.map