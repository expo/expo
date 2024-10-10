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
function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));
  _fsExtra = function () {
    return data;
  };
  return data;
}
function _jimpCompact() {
  const data = _interopRequireDefault(require("jimp-compact"));
  _jimpCompact = function () {
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
// @ts-ignore

const SPLASH_SCREEN_FILENAME = 'splashscreen_logo.png';
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
const withAndroidSplashImages = (config, props) => {
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    await setSplashImageDrawablesAsync(config, config.modRequest.projectRoot, props?.logoWidth ?? 100);
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
async function setSplashImageDrawablesAsync(config, projectRoot, logoWidth) {
  await clearAllExistingSplashImagesAsync(projectRoot);
  const splash = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config);
  const darkSplash = (0, _getAndroidSplashConfig().getAndroidDarkSplashConfig)(config);
  await Promise.all([setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot, logoWidth), setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot, logoWidth)]);
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
async function setSplashImageDrawablesForThemeAsync(config, theme, projectRoot, logoWidth) {
  if (!config) return;
  const androidMainPath = _path().default.join(projectRoot, 'android/app/src/main');
  const sizes = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  await Promise.all(sizes.map(async imageKey => {
    // @ts-ignore
    const url = config[imageKey];
    const image = await _jimpCompact().default.read(url).catch(() => null);
    if (image) {
      const multiplier = DRAWABLES_CONFIGS[imageKey].dimensionsMultiplier;
      const width = logoWidth * multiplier; // "logoWidth" must be replaced by the logo width chosen by the user in its config file
      const height = Math.ceil(width * (image.bitmap.height / image.bitmap.width)); // compute the height according to the width and image ratio

      // https://developer.android.com/develop/ui/views/launch/splash-screen#dimensions
      const canvasSize = 288 * multiplier;
      const canvas = await _jimpCompact().default.create(canvasSize, canvasSize, 0xffffff00);
      const input = image.clone().resize(width, height);
      const x = (canvasSize - width) / 2;
      const y = (canvasSize - height) / 2;
      const output = canvas.blit(input, x, y).quality(100);

      // Get output path for drawable.
      const outputPath = _path().default.join(androidMainPath, DRAWABLES_CONFIGS[imageKey].modes[theme].path);
      const folder = _path().default.dirname(outputPath);
      // Ensure directory exists.
      await _fsExtra().default.ensureDir(folder);
      await output.writeAsync(outputPath);
    }
    return null;
  }));
}
//# sourceMappingURL=withAndroidSplashImages.js.map