import { AndroidConfig } from 'expo/config-plugins';

import {
  META_DATA_PRESENT_DATA_ONLY_NOTIFICATIONS_WITH_TITLE,
  setNotificationConfig,
} from '../withNotificationsAndroid';

function createManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  } as AndroidConfig.Manifest.AndroidManifest;
}

function getMetaDataValue(manifest: AndroidConfig.Manifest.AndroidManifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  return application['meta-data']?.find(
    (item) => item.$['android:name'] === META_DATA_PRESENT_DATA_ONLY_NOTIFICATIONS_WITH_TITLE
  )?.$['android:value'];
}

describe('presentDataOnlyNotificationsWithTitle', () => {
  const baseProps = { icon: null, color: null };

  it('adds meta-data set to "true"', () => {
    const manifest = setNotificationConfig(
      { ...baseProps, presentDataOnlyNotificationsWithTitle: true },
      createManifest()
    );
    expect(getMetaDataValue(manifest)).toBe('true');
  });

  it('adds meta-data set to "false"', () => {
    const manifest = setNotificationConfig(
      { ...baseProps, presentDataOnlyNotificationsWithTitle: false },
      createManifest()
    );
    expect(getMetaDataValue(manifest)).toBe('false');
  });

  it('does not add meta-data when unset', () => {
    const manifest = setNotificationConfig(baseProps, createManifest());
    expect(getMetaDataValue(manifest)).toBeUndefined();
  });

  it('removes existing meta-data when unset', () => {
    const withValue = setNotificationConfig(
      { ...baseProps, presentDataOnlyNotificationsWithTitle: false },
      createManifest()
    );
    const manifest = setNotificationConfig(baseProps, withValue);
    expect(getMetaDataValue(manifest)).toBeUndefined();
  });
});
