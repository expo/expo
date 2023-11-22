import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
  findNewInstanceCodeBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { replaceContentsWithOffset } from '@expo/config-plugins/build/utils/commonCodeMod';

export const withAndroidModulesMainActivity: ConfigPlugin = config => {
  return withMainActivity(config, config => {
    config.modResults.contents = setModulesMainActivity(
      config.modResults.contents,
      config.modResults.language
    );
    return config;
  });
};

export function setModulesMainActivity(mainActivity: string, language: 'java' | 'kt'): string {
  const isJava = language === 'java';

  if (mainActivity.match(/\s+ReactActivityDelegateWrapper\(/m) != null) {
    // Early return if `ReactActivityDelegateWrapper` is already added.
    return mainActivity;
  }

  if (mainActivity.match(/\s+createReactActivityDelegate\(\)/m) == null) {
    // If not override `createReactActivityDelegate()`, tries to override with wrapper
    mainActivity = addImports(
      mainActivity,
      ['com.facebook.react.ReactActivityDelegate', 'expo.modules.ReactActivityDelegateWrapper'],
      isJava
    );

    const addReactActivityDelegateBlock = isJava
      ? [
          '\n  @Override',
          '  protected ReactActivityDelegate createReactActivityDelegate() {',
          '    return new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,',
          '      new ReactActivityDelegate(this, getMainComponentName())',
          '    );',
          '  }\n',
        ]
      : [
          '\n  override fun createReactActivityDelegate(): ReactActivityDelegate {',
          '    return ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,',
          '      ReactActivityDelegate(this, getMainComponentName())',
          '    );',
          '  }\n',
        ];

    mainActivity = appendContentsInsideDeclarationBlock(
      mainActivity,
      'class MainActivity',
      addReactActivityDelegateBlock.join('\n')
    );
  } else if (mainActivity.match(/\bDefaultReactActivityDelegate\b/g)) {
    // react-native@>=0.71

    // If override `createReactActivityDelegate()` already, wrap it with `ReactActivityDelegateWrapper`
    mainActivity = addImports(mainActivity, ['expo.modules.ReactActivityDelegateWrapper'], isJava);

    const newInstanceCodeBlock = findNewInstanceCodeBlock(
      mainActivity,
      'DefaultReactActivityDelegate',
      language
    );
    if (newInstanceCodeBlock == null) {
      throw new Error('Unable to find DefaultReactActivityDelegate new instance code block.');
    }

    const replacement = isJava
      ? `new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, ${newInstanceCodeBlock.code})`
      : `ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, ${newInstanceCodeBlock.code})`;
    mainActivity = replaceContentsWithOffset(
      mainActivity,
      replacement,
      newInstanceCodeBlock.start,
      newInstanceCodeBlock.end
    );

    return mainActivity;
  } else if (
    // java: public static class MainActivityDelegate extends ReactActivityDelegate {
    mainActivity.match(/\s+MainActivityDelegate\s+extends\s+ReactActivityDelegate\s+\{/) != null ||
    // kotlin: class MainActivityDelegate(activity: ReactActivity?, mainComponentName: String?) : ReactActivityDelegate
    mainActivity.match(/\s+MainActivityDelegate\(.+\)\s+:\s+ReactActivityDelegate.+\{/) != null
  ) {
    // react-native@>=0.68,<=0.70

    // If override `createReactActivityDelegate()` already, wrap it with `ReactActivityDelegateWrapper` for react-native 0.68+
    mainActivity = addImports(mainActivity, ['expo.modules.ReactActivityDelegateWrapper'], isJava);

    const newInstanceCodeBlock = findNewInstanceCodeBlock(
      mainActivity,
      'MainActivityDelegate',
      language
    );
    if (newInstanceCodeBlock == null) {
      throw new Error('Unable to find MainActivityDelegate new instance code block.');
    }

    const replacement = isJava
      ? `new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, ${newInstanceCodeBlock.code})`
      : `ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, ${newInstanceCodeBlock.code})`;
    mainActivity = replaceContentsWithOffset(
      mainActivity,
      replacement,
      newInstanceCodeBlock.start,
      newInstanceCodeBlock.end
    );

    return mainActivity;
  } else {
    // react-native@<0.68

    // If override `createReactActivityDelegate()` already, wrap it with `ReactActivityDelegateWrapper`
    mainActivity = addImports(mainActivity, ['expo.modules.ReactActivityDelegateWrapper'], isJava);

    const newInstanceCodeBlock = findNewInstanceCodeBlock(
      mainActivity,
      'ReactActivityDelegate',
      language
    );
    if (newInstanceCodeBlock == null) {
      throw new Error('Unable to find ReactActivityDelegate new instance code block.');
    }

    const replacement = isJava
      ? `new ReactActivityDelegateWrapper(this, ${newInstanceCodeBlock.code})`
      : `ReactActivityDelegateWrapper(this, ${newInstanceCodeBlock.code})`;
    mainActivity = replaceContentsWithOffset(
      mainActivity,
      replacement,
      newInstanceCodeBlock.start,
      newInstanceCodeBlock.end
    );

    return mainActivity;
  }

  return mainActivity;
}
