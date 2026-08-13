import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

/**
 * Keep in sync with `FAKE_AGE_SIGNALS_META_DATA` in the Android module, which reads this flag to
 * decide whether `setFakeAgeSignalsAsync` is allowed to do anything.
 */
export const FAKE_AGE_SIGNALS_META_DATA = 'expo.modules.agerange.ENABLE_FAKE_AGE_SIGNALS';

export type Props = {
  /**
   * Whether `setFakeAgeSignalsAsync` can report fake age signals in this build.
   *
   * Set it from an environment variable so that only the profiles you test with opt in, and
   * production builds never do.
   *
   * @default false
   * @platform android
   */
  enableFakeAgeSignals?: boolean;
};

export function setFakeAgeSignals(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  enabled: boolean
): AndroidConfig.Manifest.AndroidManifest {
  const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

  if (enabled) {
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      FAKE_AGE_SIGNALS_META_DATA,
      'true'
    );
  } else {
    // Removed rather than left alone, so that turning the prop back off takes the flag out of a
    // manifest an earlier prebuild opted in.
    AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(
      mainApplication,
      FAKE_AGE_SIGNALS_META_DATA
    );
  }

  return androidManifest;
}

const withAgeRange: ConfigPlugin<Props | undefined> = (config, props) =>
  withAndroidManifest(config, (config) => {
    config.modResults = setFakeAgeSignals(config.modResults, props?.enableFakeAgeSignals === true);
    return config;
  });

export default createRunOncePlugin(withAgeRange, pkg.name, pkg.version);
