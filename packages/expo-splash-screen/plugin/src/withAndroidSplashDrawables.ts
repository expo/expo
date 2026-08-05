import { AndroidConfig, ConfigPlugin, withDangerousMod, XML } from 'expo/config-plugins';

import { AndroidSplashConfig } from './types';

export const withAndroidSplashDrawables: ConfigPlugin<AndroidSplashConfig> = (config, splash) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await setSplashDrawableAsync(splash, config.modRequest.projectRoot);
      return config;
    },
  ]);
};

export async function setSplashDrawableAsync({ image }: AndroidSplashConfig, projectRoot: string) {
  const filePath = (await AndroidConfig.Paths.getResourceXMLPathAsync(projectRoot, {
    name: 'ic_launcher_background',
    kind: 'drawable',
  }))!;

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
  await XML.writeXMLAsync({ path: filePath, xml: xmlContent });
}
