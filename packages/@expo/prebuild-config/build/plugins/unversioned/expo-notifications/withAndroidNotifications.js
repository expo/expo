"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON = void 0;
exports.getNotificationColor = getNotificationColor;
exports.getNotificationIcon = getNotificationIcon;
exports.setNotificationConfig = setNotificationConfig;
exports.setNotificationIconAsync = setNotificationIconAsync;
exports.setNotificationIconColor = setNotificationIconColor;
exports.withNotificationManifest = exports.withNotificationIcons = exports.withNotificationIconColor = void 0;
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
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _withAndroidIcons() {
  const data = require("../../icons/withAndroidIcons");
  _withAndroidIcons = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  Colors
} = _configPlugins().AndroidConfig;
const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication
} = _configPlugins().AndroidConfig.Manifest;
const BASELINE_PIXEL_SIZE = 24;
const META_DATA_NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON = 'expo.modules.notifications.default_notification_icon';
const META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON_COLOR = 'expo.modules.notifications.default_notification_color';
const NOTIFICATION_ICON = exports.NOTIFICATION_ICON = 'notification_icon';
const NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON_RESOURCE = `@drawable/${NOTIFICATION_ICON}`;
const NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON_COLOR = 'notification_icon_color';
const NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${NOTIFICATION_ICON_COLOR}`;
const withNotificationIcons = config => {
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    await setNotificationIconAsync(config, config.modRequest.projectRoot);
    return config;
  }]);
};
exports.withNotificationIcons = withNotificationIcons;
const withNotificationIconColor = config => {
  return (0, _configPlugins().withAndroidColors)(config, config => {
    config.modResults = setNotificationIconColor(config, config.modResults);
    return config;
  });
};
exports.withNotificationIconColor = withNotificationIconColor;
const withNotificationManifest = config => {
  return (0, _configPlugins().withAndroidManifest)(config, config => {
    config.modResults = setNotificationConfig(config, config.modResults);
    return config;
  });
};
exports.withNotificationManifest = withNotificationManifest;
function getNotificationIcon(config) {
  return config.notification?.icon || null;
}
function getNotificationColor(config) {
  return config.notification?.color || null;
}

/**
 * Applies configuration for expo-notifications, including
 * the notification icon and notification color.
 */
async function setNotificationIconAsync(config, projectRoot) {
  const icon = getNotificationIcon(config);
  if (icon) {
    await writeNotificationIconImageFilesAsync(icon, projectRoot);
  } else {
    await removeNotificationIconImageFilesAsync(projectRoot);
  }
}
function setNotificationConfig(config, manifest) {
  const icon = getNotificationIcon(config);
  const color = getNotificationColor(config);
  const mainApplication = getMainApplicationOrThrow(manifest);
  if (icon) {
    addMetaDataItemToMainApplication(mainApplication, META_DATA_NOTIFICATION_ICON, NOTIFICATION_ICON_RESOURCE, 'resource');
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_DATA_NOTIFICATION_ICON);
  }
  if (color) {
    addMetaDataItemToMainApplication(mainApplication, META_DATA_NOTIFICATION_ICON_COLOR, NOTIFICATION_ICON_COLOR_RESOURCE, 'resource');
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_DATA_NOTIFICATION_ICON_COLOR);
  }
  return manifest;
}
function setNotificationIconColor(config, colors) {
  return Colors.assignColorValue(colors, {
    name: NOTIFICATION_ICON_COLOR,
    value: getNotificationColor(config)
  });
}
async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
  await Promise.all(Object.values(_withAndroidIcons().dpiValues).map(async ({
    folderName,
    scale
  }) => {
    const drawableFolderName = folderName.replace('mipmap', 'drawable');
    const dpiFolderPath = _path().default.resolve(projectRoot, _withAndroidIcons().ANDROID_RES_PATH, drawableFolderName);
    await _fs().default.promises.mkdir(dpiFolderPath, {
      recursive: true
    });
    const iconSizePx = BASELINE_PIXEL_SIZE * scale;
    try {
      const resizedIcon = (await (0, _imageUtils().generateImageAsync)({
        projectRoot,
        cacheType: 'android-notification'
      }, {
        src: icon,
        width: iconSizePx,
        height: iconSizePx,
        resizeMode: 'cover',
        backgroundColor: 'transparent'
      })).source;
      await _fs().default.promises.writeFile(_path().default.resolve(dpiFolderPath, NOTIFICATION_ICON + '.png'), resizedIcon);
    } catch (e) {
      throw new Error('Encountered an issue resizing Android notification icon: ' + e);
    }
  }));
}
async function removeNotificationIconImageFilesAsync(projectRoot) {
  await Promise.all(Object.values(_withAndroidIcons().dpiValues).map(async ({
    folderName
  }) => {
    const drawableFolderName = folderName.replace('mipmap', 'drawable');
    const dpiFolderPath = _path().default.resolve(projectRoot, _withAndroidIcons().ANDROID_RES_PATH, drawableFolderName);
    await _fs().default.promises.rm(_path().default.resolve(dpiFolderPath, NOTIFICATION_ICON + '.png'), {
      force: true
    });
  }));
}
//# sourceMappingURL=withAndroidNotifications.js.map