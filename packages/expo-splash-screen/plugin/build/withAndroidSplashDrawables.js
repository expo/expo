"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidSplashDrawables = void 0;
exports.setSplashDrawableAsync = setSplashDrawableAsync;
const config_plugins_1 = require("expo/config-plugins");
const withAndroidSplashDrawables = (config, splash) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setSplashDrawableAsync(splash, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withAndroidSplashDrawables = withAndroidSplashDrawables;
async function setSplashDrawableAsync({ image }, projectRoot) {
    const filePath = (await config_plugins_1.AndroidConfig.Paths.getResourceXMLPathAsync(projectRoot, {
        name: 'ic_launcher_background',
        kind: 'drawable',
    }));
    // Nuke and rewrite the splashscreen.xml drawable
    const xmlContent = {
        'layer-list': {
            $: {
                'xmlns:android': 'http://schemas.android.com/apk/res/android',
            },
            item: [
                {
                    $: {
                        // TODO: Ensure these keys don't get out of sync
                        'android:drawable': '@color/splashscreen_background',
                    },
                },
                image && {
                    bitmap: [
                        {
                            $: {
                                'android:gravity': 'center',
                                // TODO: Ensure these keys don't get out of sync
                                'android:src': '@drawable/splashscreen_logo',
                            },
                        },
                    ],
                },
            ].filter(Boolean),
        },
    };
    await config_plugins_1.XML.writeXMLAsync({ path: filePath, xml: xmlContent });
}
