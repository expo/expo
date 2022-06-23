import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withStringsXml,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const { buildResourceItem } = AndroidConfig.Resources;
const { removeStringItem, setStringItem } = AndroidConfig.Strings;
const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  prefixAndroidKeys,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const CUSTOM_TAB_ACTIVITY = 'com.facebook.CustomTabActivity';
const STRING_FACEBOOK_APP_ID = 'facebook_app_id';
const META_APP_ID = 'com.facebook.sdk.ApplicationId';
const META_APP_NAME = 'com.facebook.sdk.ApplicationName';
const META_AUTO_INIT = 'com.facebook.sdk.AutoInitEnabled';
const META_AUTO_LOG_APP_EVENTS = 'com.facebook.sdk.AutoLogAppEventsEnabled';
const META_AD_ID_COLLECTION = 'com.facebook.sdk.AdvertiserIDCollectionEnabled';

export const withFacebookAppIdString: ConfigPlugin = config => {
  return withStringsXml(config, config => {
    config.modResults = applyFacebookAppIdString(config, config.modResults);
    return config;
  });
};

export const withFacebookManifest: ConfigPlugin = config => {
  return withAndroidManifest(config, config => {
    config.modResults = setFacebookConfig(config, config.modResults);
    return config;
  });
};

function buildXMLItem({
  head,
  children,
}: {
  head: Record<string, string>;
  children?: Record<string, string | any[]>;
}) {
  return { ...(children ?? {}), $: head };
}

function buildAndroidItem(datum: string | Record<string, any>) {
  const item = typeof datum === 'string' ? { name: datum } : datum;
  const head = prefixAndroidKeys(item);
  return buildXMLItem({ head });
}

function getFacebookSchemeActivity(scheme: string) {
  /**
   <activity
      android:name="com.facebook.CustomTabActivity"
      android:exported="true">
      <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="${scheme}" />
      </intent-filter>
  </activity>
     */
  return buildXMLItem({
    head: prefixAndroidKeys({
      name: CUSTOM_TAB_ACTIVITY,
      exported: 'true',
    }),
    children: {
      'intent-filter': [
        {
          action: [buildAndroidItem('android.intent.action.VIEW')],
          category: [
            buildAndroidItem('android.intent.category.DEFAULT'),
            buildAndroidItem('android.intent.category.BROWSABLE'),
          ],
          data: [buildAndroidItem({ scheme })],
        },
      ],
    },
  }) as AndroidConfig.Manifest.ManifestActivity;
}

type ExpoConfigFacebook = Pick<
  ExpoConfig,
  | 'facebookScheme'
  | 'facebookAdvertiserIDCollectionEnabled'
  | 'facebookAppId'
  | 'facebookAutoInitEnabled'
  | 'facebookAutoLogAppEventsEnabled'
  | 'facebookDisplayName'
>;

export function getFacebookScheme(config: ExpoConfigFacebook) {
  return config.facebookScheme ?? null;
}

export function getFacebookAppId(config: ExpoConfigFacebook) {
  return config.facebookAppId ?? null;
}

export function getFacebookDisplayName(config: ExpoConfigFacebook) {
  return config.facebookDisplayName ?? null;
}
export function getFacebookAutoInitEnabled(config: ExpoConfigFacebook) {
  return config.facebookAutoInitEnabled ?? null;
}

export function getFacebookAutoLogAppEvents(config: ExpoConfigFacebook) {
  return config.facebookAutoLogAppEventsEnabled ?? null;
}

export function getFacebookAdvertiserIDCollection(config: ExpoConfigFacebook) {
  return config.facebookAdvertiserIDCollectionEnabled ?? null;
}

function ensureFacebookActivity({
  mainApplication,
  scheme,
}: {
  mainApplication: AndroidConfig.Manifest.ManifestApplication;
  scheme: string | null;
}) {
  if (Array.isArray(mainApplication.activity)) {
    // Remove all Facebook CustomTabActivities first
    mainApplication.activity = mainApplication.activity.filter(activity => {
      return activity.$?.['android:name'] !== CUSTOM_TAB_ACTIVITY;
    });
  } else {
    mainApplication.activity = [];
  }

  // If a new scheme is defined, append it to the activity.
  if (scheme) {
    mainApplication.activity.push(getFacebookSchemeActivity(scheme));
  }
  return mainApplication;
}

function applyFacebookAppIdString(
  config: ExpoConfigFacebook,
  stringsJSON: AndroidConfig.Resources.ResourceXML
) {
  const appId = getFacebookAppId(config);

  if (appId) {
    return setStringItem(
      [buildResourceItem({ name: STRING_FACEBOOK_APP_ID, value: appId })],
      stringsJSON
    );
  }
  return removeStringItem(STRING_FACEBOOK_APP_ID, stringsJSON);
}

export function setFacebookConfig(
  config: ExpoConfigFacebook,
  androidManifest: AndroidConfig.Manifest.AndroidManifest
) {
  const scheme = getFacebookScheme(config);

  const appId = getFacebookAppId(config);
  const displayName = getFacebookDisplayName(config);
  const autoInitEnabled = getFacebookAutoInitEnabled(config);
  const autoLogAppEvents = getFacebookAutoLogAppEvents(config);
  const advertiserIdCollection = getFacebookAdvertiserIDCollection(config);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mainApplication = getMainApplicationOrThrow(androidManifest);

  mainApplication = ensureFacebookActivity({ scheme, mainApplication });

  if (appId) {
    mainApplication = addMetaDataItemToMainApplication(
      mainApplication,
      META_APP_ID,
      `@string/${STRING_FACEBOOK_APP_ID}`
    );
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_APP_ID);
  }
  if (displayName) {
    mainApplication = addMetaDataItemToMainApplication(mainApplication, META_APP_NAME, displayName);
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_APP_NAME);
  }
  if (autoInitEnabled !== null) {
    mainApplication = addMetaDataItemToMainApplication(
      mainApplication,
      META_AUTO_INIT,
      autoInitEnabled ? 'true' : 'false'
    );
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_AUTO_INIT);
  }
  if (autoLogAppEvents !== null) {
    mainApplication = addMetaDataItemToMainApplication(
      mainApplication,
      META_AUTO_LOG_APP_EVENTS,
      autoLogAppEvents ? 'true' : 'false'
    );
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(
      mainApplication,
      META_AUTO_LOG_APP_EVENTS
    );
  }
  if (advertiserIdCollection !== null) {
    mainApplication = addMetaDataItemToMainApplication(
      mainApplication,
      META_AD_ID_COLLECTION,
      advertiserIdCollection ? 'true' : 'false'
    );
  } else {
    // eslint-disable-next-line
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_AD_ID_COLLECTION);
  }

  return androidManifest;
}
