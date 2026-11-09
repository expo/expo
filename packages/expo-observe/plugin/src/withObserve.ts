import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

// Read by `ObserveModule` on iOS and Android (do not change).
const IOS_FEEDBACK_ENABLED_KEY = 'EXObserveFeedbackEnabled';
const ANDROID_FEEDBACK_ENABLED_KEY = 'expo.modules.observe.FEEDBACK_ENABLED';

export type Props = {
  /**
   * Enables `Observe.reportFeedback`. On iOS, it also adds Customer Support to the app's privacy
   * manifest.
   * @default false
   */
  feedback?: boolean;
};

const withObserve: ConfigPlugin<Props | void> = (config, props) => {
  if (!props?.feedback) {
    return config;
  }

  const privacyManifests = config.ios?.privacyManifests ?? {};
  config.ios = {
    ...config.ios,
    infoPlist: { ...config.ios?.infoPlist, [IOS_FEEDBACK_ENABLED_KEY]: true },
    privacyManifests: {
      ...privacyManifests,
      NSPrivacyCollectedDataTypes: [
        ...(privacyManifests.NSPrivacyCollectedDataTypes ?? []),
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCustomerSupport',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
    },
  };

  return withAndroidManifest(config, (config) => {
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults),
      ANDROID_FEEDBACK_ENABLED_KEY,
      'true'
    );
    return config;
  });
};

export default createRunOncePlugin(withObserve, pkg.name, pkg.version);
