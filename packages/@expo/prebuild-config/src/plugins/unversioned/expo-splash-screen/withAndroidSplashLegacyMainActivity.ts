import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';
import { addImports } from '@expo/config-plugins/build/android/codeMod';
import { mergeContents, removeContents } from '@expo/config-plugins/build/utils/generateCode';
import { ExpoConfig } from '@expo/config-types';
import Debug from 'debug';

import { getAndroidSplashConfig } from './getAndroidSplashConfig';

const debug = Debug('expo:prebuild-config:expo-splash-screen:android:mainActivity');

// DO NOT CHANGE
const SHOW_SPLASH_ID = 'expo-splash-screen-mainActivity-onCreate-show-splash';

export const withAndroidSplashLegacyMainActivity: ConfigPlugin = config => {
  return withMainActivity(config, config => {
    config.modResults.contents = setSplashScreenLegacyMainActivity(
      config,
      config.modResults.contents,
      config.modResults.language
    );
    return config;
  });
};

export function setSplashScreenLegacyMainActivity(
  config: Pick<ExpoConfig, 'android' | 'androidStatusBar' | 'userInterfaceStyle'>,
  mainActivity: string,
  language: 'java' | 'kt'
): string {
  debug(`Modify with language: "${language}"`);
  const splashConfig = getAndroidSplashConfig(config);

  if (!splashConfig) {
    // Remove our generated code safely...
    const mod = removeContents({
      src: mainActivity,
      tag: SHOW_SPLASH_ID,
    });

    mainActivity = mod.contents;
    if (mod.didClear) {
      debug('Removed SplashScreen.show()');
    }
    return mainActivity;
  }
  // TODO: Translucent is weird
  const statusBarTranslucent = !!config.androidStatusBar?.translucent;

  const { resizeMode } = splashConfig;
  const isJava = language === 'java';
  const LE = isJava ? ';' : '';

  mainActivity = addImports(
    mainActivity,
    [
      'expo.modules.splashscreen.SplashScreen',
      'expo.modules.splashscreen.SplashScreenImageResizeMode',
      'android.os.Bundle',
    ],
    isJava
  );

  if (!mainActivity.match(/(?<=^.*super\.onCreate.*$)/m)) {
    const onCreateBlock = isJava
      ? [
          '    @Override',
          '    protected void onCreate(Bundle savedInstanceState) {',
          '      super.onCreate(savedInstanceState);',
          '    }',
        ]
      : [
          '    override fun onCreate(savedInstanceState: Bundle?) {',
          '      super.onCreate(savedInstanceState)',
          '    }',
        ];

    mainActivity = mergeContents({
      src: mainActivity,
      // insert just below super.onCreate
      anchor: isJava
        ? /(?<=public\s+class\s+.*\s+extends\s+.*\s+{.*$)/m
        : /(?<=class\s+.*\s+:\s+.*\s+{.*$)/m,
      offset: 1,
      comment: '//',
      tag: 'expo-splash-screen-mainActivity-onCreate',
      newSrc: onCreateBlock.join('\n'),
    }).contents;
  }

  // Remove our generated code safely...
  mainActivity = removeContents({
    src: mainActivity,
    tag: SHOW_SPLASH_ID,
  }).contents;

  // Remove code from `@expo/configure-splash-screen`
  mainActivity = mainActivity
    .split('\n')
    .filter(line => {
      return !/SplashScreen\.show\(this,\s?SplashScreenImageResizeMode\./.test(line);
    })
    .join('\n');

  // Reapply generated code.
  mainActivity = mergeContents({
    src: mainActivity,
    // insert just below super.onCreate
    anchor: /(?<=^.*super\.onCreate.*$)/m,
    offset: 1,
    comment: '//',
    tag: SHOW_SPLASH_ID,
    newSrc: `    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView${
      isJava ? '.class' : '::class.java'
    }, ${statusBarTranslucent})${LE}`,
  }).contents;

  // TODO: Remove old `SplashScreen.show`

  return mainActivity;
}
