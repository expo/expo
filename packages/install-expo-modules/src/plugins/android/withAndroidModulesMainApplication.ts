import { ConfigPlugin, withMainApplication } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
  findNewInstanceCodeBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { replaceContentsWithOffset } from '@expo/config-plugins/build/utils/commonCodeMod';

export const withAndroidModulesMainApplication: ConfigPlugin = config => {
  return withMainApplication(config, config => {
    config.modResults.contents = setModulesMainApplication(
      config.modResults.contents,
      config.modResults.language
    );
    return config;
  });
};

export function setModulesMainApplication(
  mainApplication: string,
  language: 'java' | 'kt'
): string {
  const isJava = language === 'java';

  mainApplication = addDefaultReactNativeHostWrapperIfNeeded(mainApplication, language, isJava);
  mainApplication = addReactNativeHostWrapperIfNeeded(mainApplication, language, isJava);
  mainApplication = addReactNativeNewArchHostWrapperIfNeeded(mainApplication, language, isJava);
  mainApplication = addApplicationLifecycleDispatchImportIfNeeded(
    mainApplication,
    language,
    isJava
  );
  mainApplication = addApplicationCreateIfNeeded(mainApplication, language, isJava);
  mainApplication = addConfigurationChangeIfNeeded(mainApplication, language, isJava);

  return mainApplication;
}

/**
 * Add `ReactNativeHostWrapper` for `DefaultReactNativeHost`.
 * For react-native@>=0.71
 */
function addDefaultReactNativeHostWrapperIfNeeded(
  mainApplication: string,
  language: 'java' | 'kt',
  isJava: boolean
): string {
  // Early return when there's no `DefaultReactNativeHost`.
  if (!mainApplication.match(/^import .*\.defaults\.DefaultReactNativeHost;?$/m)) {
    return mainApplication;
  }

  if (mainApplication.match(/\s+ReactNativeHostWrapper\(this,.*DefaultReactNativeHost\(/m)) {
    return mainApplication;
  }

  if (mainApplication.match(/\s+ReactNativeHostWrapper\(/m)) {
    return mainApplication;
  }

  mainApplication = addImports(mainApplication, ['expo.modules.ReactNativeHostWrapper'], isJava);

  const newInstanceCodeBlock = findNewInstanceCodeBlock(
    mainApplication,
    'DefaultReactNativeHost',
    language
  );
  if (newInstanceCodeBlock == null) {
    throw new Error('Unable to find DefaultReactNativeHost new instance code block.');
  }

  const replacement = isJava
    ? `new ReactNativeHostWrapper(this, ${newInstanceCodeBlock.code})`
    : `ReactNativeHostWrapper(this, ${newInstanceCodeBlock.code})`;
  mainApplication = replaceContentsWithOffset(
    mainApplication,
    replacement,
    newInstanceCodeBlock.start,
    newInstanceCodeBlock.end
  );
  return mainApplication;
}

function addReactNativeHostWrapperIfNeeded(
  mainApplication: string,
  language: 'java' | 'kt',
  isJava: boolean
): string {
  if (mainApplication.match(/\s+ReactNativeHostWrapper\(/m)) {
    return mainApplication;
  }

  mainApplication = addImports(mainApplication, ['expo.modules.ReactNativeHostWrapper'], isJava);

  const newInstanceCodeBlock = findNewInstanceCodeBlock(
    mainApplication,
    'ReactNativeHost',
    language
  );
  if (newInstanceCodeBlock == null) {
    throw new Error('Unable to find ReactNativeHost new instance code block.');
  }

  const replacement = isJava
    ? `new ReactNativeHostWrapper(this, ${newInstanceCodeBlock.code})`
    : `ReactNativeHostWrapper(this, ${newInstanceCodeBlock.code})`;
  mainApplication = replaceContentsWithOffset(
    mainApplication,
    replacement,
    newInstanceCodeBlock.start,
    newInstanceCodeBlock.end
  );
  return mainApplication;
}

function addReactNativeNewArchHostWrapperIfNeeded(
  mainApplication: string,
  language: 'java' | 'kt',
  isJava: boolean
): string {
  // Early return when there's no new arch `MainApplicationReactNativeHost`.
  if (!mainApplication.match(/^import .*\.newarchitecture\.MainApplicationReactNativeHost;?$/m)) {
    return mainApplication;
  }

  if (
    mainApplication.match(/\s+ReactNativeHostWrapper\(this,.*MainApplicationReactNativeHost\(/m)
  ) {
    return mainApplication;
  }

  mainApplication = addImports(mainApplication, ['expo.modules.ReactNativeHostWrapper'], isJava);

  const newInstanceCodeBlock = findNewInstanceCodeBlock(
    mainApplication,
    'MainApplicationReactNativeHost',
    language
  );
  if (newInstanceCodeBlock == null) {
    throw new Error('Unable to find ReactNativeHost new instance code block.');
  }

  const replacement = isJava
    ? `new ReactNativeHostWrapper(this, ${newInstanceCodeBlock.code})`
    : `ReactNativeHostWrapper(this, ${newInstanceCodeBlock.code})`;
  mainApplication = replaceContentsWithOffset(
    mainApplication,
    replacement,
    newInstanceCodeBlock.start,
    newInstanceCodeBlock.end
  );
  return mainApplication;
}

function addApplicationLifecycleDispatchImportIfNeeded(
  mainApplication: string,
  language: 'java' | 'kt',
  isJava: boolean
) {
  if (mainApplication.match(/^import\s+expo\.modules\.ApplicationLifecycleDispatcher;?$/)) {
    return mainApplication;
  }

  return addImports(mainApplication, ['expo.modules.ApplicationLifecycleDispatcher'], isJava);
}

function addApplicationCreateIfNeeded(
  mainApplication: string,
  language: 'java' | 'kt',
  isJava: boolean
): string {
  if (mainApplication.match(/\s+ApplicationLifecycleDispatcher\.onApplicationCreate\(/m)) {
    return mainApplication;
  }

  return appendContentsInsideDeclarationBlock(
    mainApplication,
    'onCreate',
    `  ApplicationLifecycleDispatcher.onApplicationCreate(this)${isJava ? ';' : ''}\n  `
  );
}

function addConfigurationChangeIfNeeded(
  mainApplication: string,
  language: 'java' | 'kt',
  isJava: boolean
): string {
  if (mainApplication.match(/\s+onConfigurationChanged\(/m) == null) {
    // If not override onConfigurationChanged() at all
    mainApplication = addImports(mainApplication, ['android.content.res.Configuration'], isJava);

    const addConfigurationChangeBlock = isJava
      ? [
          '\n  @Override',
          '  public void onConfigurationChanged(Configuration newConfig) {',
          '    super.onConfigurationChanged(newConfig);',
          '    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);',
          '  }\n',
        ].join('\n')
      : [
          '\n  override fun onConfigurationChanged(newConfig: Configuration) {',
          '    super.onConfigurationChanged(newConfig)',
          '    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)',
          '  }\n',
        ].join('\n');
    mainApplication = appendContentsInsideDeclarationBlock(
      mainApplication,
      'class MainApplication',
      addConfigurationChangeBlock
    );
  } else if (
    mainApplication.match(/\s+ApplicationLifecycleDispatcher\.onConfigurationChanged\(/m) == null
  ) {
    // If override onConfigurationChanged() but no ApplicationLifecycleDispatcher yet
    mainApplication = appendContentsInsideDeclarationBlock(
      mainApplication,
      'onConfigurationChanged',
      `  ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)${
        isJava ? ';' : ''
      }\n  `
    );
  }

  return mainApplication;
}
