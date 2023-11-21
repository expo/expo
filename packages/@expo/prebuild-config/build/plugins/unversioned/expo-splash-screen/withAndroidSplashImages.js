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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_image.png';
const DRAWABLES_CONFIGS = {
  default: {
    modes: {
      light: {
        path: `./res/drawable/${SPLASH_SCREEN_FILENAME}`
      },
      dark: {
        path: `./res/drawable-night/${SPLASH_SCREEN_FILENAME}`
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
const withAndroidSplashImages = config => {
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    await setSplashImageDrawablesAsync(config, config.modRequest.projectRoot);
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
async function setSplashImageDrawablesAsync(config, projectRoot) {
  await clearAllExistingSplashImagesAsync(projectRoot);
  const splash = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config);
  const darkSplash = (0, _getAndroidSplashConfig().getAndroidDarkSplashConfig)(config);
  await Promise.all([setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot), setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot)]);
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
async function setSplashImageDrawablesForThemeAsync(config, theme, projectRoot) {
  if (!config) return;
  const androidMainPath = _path().default.join(projectRoot, 'android/app/src/main');
  await Promise.all(['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map(async imageKey => {
    // @ts-ignore
    const image = config[imageKey];
    if (image) {
      // Using this method will cache the images in `.expo` based on the properties used to generate them.
      // this method also supports remote URLs and using the global sharp instance.
      const {
        source
      } = await (0, _imageUtils().generateImageAsync)({
        projectRoot,
        cacheType: IMAGE_CACHE_NAME
      }, {
        src: image
      });

      // Get output path for drawable.
      const outputPath = _path().default.join(androidMainPath,
      // @ts-ignore
      DRAWABLES_CONFIGS[imageKey].modes[theme].path);
      // Ensure directory exists.
      const folder = _path().default.dirname(outputPath);
      await _fsExtra().default.ensureDir(folder);
      // Write image buffer to the file system.
      await _fsExtra().default.writeFile(outputPath, source);
    }
    return null;
  }));
}
//# sourceMappingURL=withAndroidSplashImages.js.map