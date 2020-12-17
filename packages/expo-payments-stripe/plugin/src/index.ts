import {
  withXcodeProject,
  withAndroidManifest,
  IOSConfig,
  AndroidConfig,
  ConfigPlugin,
} from '@expo/config-plugins';

const {
  prefixAndroidKeys,
  getMainApplicationOrThrow,
  addMetaDataItemToMainApplication,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const CUSTOM_TAB_ACTIVITY = 'expo.modules.payments.stripe.RedirectUriReceiver';
const META_WALLET = 'com.google.android.gms.wallet.api.enabled';

function buildXMLItem({
  head,
  children,
}: {
  head: Record<string, string>;
  children?: Record<string, string | any[]>;
}) {
  return { ...(children || {}), $: head };
}

function buildAndroidItem(datum: string | Record<string, any>) {
  const item = typeof datum === 'string' ? { name: datum } : datum;
  const head = prefixAndroidKeys(item);
  return buildXMLItem({ head });
}

// From Android.Facebook
function getStripeSchemeActivity(scheme: string) {
  /**
     <activity
        android:name="expo.modules.payments.stripe.RedirectUriReceiver"
        ...
        android:value="true">
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
      theme: '@android:style/Theme.Translucent.NoTitleBar.Fullscreen',
      launchMode: 'singleTask',
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

export function ensureStripeActivity({
  mainApplication,
  scheme,
}: {
  mainApplication: AndroidConfig.Manifest.ManifestApplication;
  scheme: string;
}) {
  if (Array.isArray(mainApplication.activity)) {
    // Remove all Facebook CustomTabActivities first
    mainApplication.activity = mainApplication.activity.filter(activity => {
      return (activity.$ || {})['android:name'] !== CUSTOM_TAB_ACTIVITY;
    });
  } else {
    mainApplication.activity = [];
  }

  // If a new scheme is defined, append it to the activity.
  if (scheme) {
    mainApplication.activity.push(getStripeSchemeActivity(scheme));
  }
  return mainApplication;
}

export const withStripeIos: ConfigPlugin<{ scheme: string }> = (config, { scheme }) => {
  // Add the scheme on iOS
  if (!config.ios) {
    config.ios = {};
  }
  // @ts-ignore: not on type yet
  if (!config.ios.scheme) {
    // @ts-ignore: not on type yet
    config.ios.scheme = [];
  }
  // @ts-ignore: not on type yet
  if (config.ios.scheme && !Array.isArray(config.ios.scheme)) {
    // @ts-ignore: not on type yet
    config.ios.scheme = [config.ios.scheme];
  }
  // @ts-ignore: not on type yet
  config.ios.scheme.push(scheme);

  // Append store kit
  config = withStoreKit(config);
  return config;
};

const withStripeAndroid: ConfigPlugin<{ scheme: string }> = (config, { scheme }) => {
  return withAndroidManifest(config, config => {
    let mainApplication = getMainApplicationOrThrow(config.modResults);
    mainApplication = ensureStripeActivity({ mainApplication, scheme });

    if (!!scheme) {
      mainApplication = addMetaDataItemToMainApplication(mainApplication, META_WALLET, 'true');
    } else {
      mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_WALLET);
    }

    return config;
  });
};

const withStripe: ConfigPlugin<{ scheme: string }> = (config, { scheme }) => {
  config = withStripeIos(config, { scheme });
  // Add the custom scheme and meta on Android
  config = withStripeAndroid(config, { scheme });
  return config;
};

const withStoreKit: ConfigPlugin = config => {
  return withXcodeProject(config, config => {
    // TODO: Ensure framework doesn't already exist
    IOSConfig.XcodeUtils.addFramework({
      project: config.modResults,
      projectName: config.modRequest.projectName!,
      framework: 'StoreKit.framework',
    });

    return config;
  });
};

export default withStripe;
