"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSplashDrawableAsync = setSplashDrawableAsync;
exports.withAndroidSplashDrawables = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withAndroidSplashDrawables = (config, splash) => {
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    if (splash) {
      await setSplashDrawableAsync(splash, config.modRequest.projectRoot);
    }
    return config;
  }]);
};
exports.withAndroidSplashDrawables = withAndroidSplashDrawables;
async function setSplashDrawableAsync({
  resizeMode
}, projectRoot) {
  const filePath = await _configPlugins().AndroidConfig.Paths.getResourceXMLPathAsync(projectRoot, {
    name: 'splashscreen',
    kind: 'drawable'
  });

  // Nuke and rewrite the splashscreen.xml drawable
  const xmlContent = {
    'layer-list': {
      $: {
        'xmlns:android': 'http://schemas.android.com/apk/res/android'
      },
      item: [{
        $: {
          // TODO: Ensure these keys don't get out of sync
          'android:drawable': '@color/splashscreen_background'
        }
      },
      // Only include the image if resizeMode native is in-use.
      resizeMode === 'native' && {
        bitmap: [{
          $: {
            'android:gravity': 'center',
            // TODO: Ensure these keys don't get out of sync
            'android:src': '@drawable/splashscreen_image'
          }
        }]
      }].filter(Boolean)
    }
  };
  await _configPlugins().XML.writeXMLAsync({
    path: filePath,
    xml: xmlContent
  });
}
//# sourceMappingURL=withAndroidSplashDrawables.js.map