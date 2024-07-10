import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';
import { addImports } from '@expo/config-plugins/build/android/codeMod';
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode';

export const withAndroidSplashMainActivity: ConfigPlugin = (config) => {
  return withMainActivity(config, (config) => {
    const { modResults } = config;
    const { language } = modResults;

    const withImports = addImports(
      modResults.contents.replace(
        /(\/\/ )?setTheme\(R\.style\.AppTheme\)/,
        '// setTheme(R.style.AppTheme)'
      ),
      ['expo.modules.splashscreen.SplashScreenManager'],
      language === 'java'
    );

    const init = mergeContents({
      src: withImports,
      comment: '    //',
      tag: 'expo-splashscreen',
      offset: 0,
      anchor: /super\.onCreate\(null\)/,
      newSrc: '    SplashScreenManager.registerOnActivity(this)' + (language === 'java' ? ';' : ''),
    });

    return {
      ...config,
      modResults: {
        ...modResults,
        contents: init.contents,
      },
    };
  });
};
