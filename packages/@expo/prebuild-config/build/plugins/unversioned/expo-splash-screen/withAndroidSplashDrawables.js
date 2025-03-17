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
  image
}, projectRoot) {
  const filePath = await _configPlugins().AndroidConfig.Paths.getResourceXMLPathAsync(projectRoot, {
    name: 'ic_launcher_background',
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
      }, image && {
        bitmap: [{
          $: {
            'android:gravity': 'center',
            // TODO: Ensure these keys don't get out of sync
            'android:src': '@drawable/splashscreen_logo'
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