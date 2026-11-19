import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

const CONSENTS = ['granted', 'not-granted'] as const;

export type Props = {
  /**
   * The consent state that the plugin writes to the native projects.
   * @default 'granted'
   */
  consent?: (typeof CONSENTS)[number];
};

const withObserve: ConfigPlugin<Props | void> = (config, props) => {
  // Only an absent option gets the default. A `null` must throw, thus `??` is not applicable.
  const consent = props?.consent === undefined ? 'granted' : props.consent;
  if (!CONSENTS.includes(consent)) {
    throw new Error(
      `The expo-observe config plugin could not set the consent because the \`consent\` option has an invalid value (${JSON.stringify(consent)}). Set \`consent\` to 'granted' or 'not-granted', or remove the option to use 'granted'.`
    );
  }

  config = withAndroidManifest(config, (config) => {
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults),
      'expo.modules.observe.CONSENT',
      consent
    );
    return config;
  });

  return withInfoPlist(config, (config) => {
    config.modResults.EXObserveConsent = consent;
    return config;
  });
};

export default createRunOncePlugin(withObserve, pkg.name, pkg.version);
