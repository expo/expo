import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withAndroidManifest,
  withEntitlementsPlist,
  withXcodeProject,
} from '@expo/config-plugins';

const {
  prefixAndroidKeys,
  getMainApplicationOrThrow,
  addMetaDataItemToMainApplication,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const pkg = require('expo-payments-stripe/package.json');

type StripePluginProps = {
  scheme: string;
  /**
   * The iOS merchant ID used for enabling Apple Pay.
   * Without this, the error "Missing merchant identifier" will be thrown on iOS.
   */
  merchantId: string;
};

const CUSTOM_TAB_ACTIVITY = 'expo.modules.payments.stripe.RedirectUriReceiver';
const META_WALLET = 'com.google.android.gms.wallet.api.enabled';

function buildXMLItem({
  head,
  children = {},
}: {
  head: Record<string, string>;
  children?: Record<string, string | any[]>;
}) {
  return { ...children, $: head };
}

function buildAndroidItem(name: string | Record<string, any>) {
  const item = typeof name === 'string' ? { name } : name;
  const head = prefixAndroidKeys(item);
  return buildXMLItem({ head });
}

// From Android.Facebook
function getStripeSchemeActivity(scheme: string): AndroidConfig.Manifest.ManifestActivity {
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
}): AndroidConfig.Manifest.ManifestApplication {
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
    mainApplication.activity.push(getStripeSchemeActivity(scheme));
  }
  return mainApplication;
}

export const withStripeIos: ConfigPlugin<StripePluginProps> = (config, { scheme, merchantId }) => {
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

  // Append StoreKit framework
  config = withStoreKit(config);

  // Add the Merchant ID to the entitlements
  config = withInAppPurchases(config, { merchantId });

  return config;
};

const withStripeAndroid: ConfigPlugin<Pick<StripePluginProps, 'scheme'>> = (config, { scheme }) => {
  return withAndroidManifest(config, config => {
    let mainApplication = getMainApplicationOrThrow(config.modResults);
    mainApplication = ensureStripeActivity({ mainApplication, scheme });

    if (scheme) {
      addMetaDataItemToMainApplication(mainApplication, META_WALLET, 'true');
    } else {
      removeMetaDataItemFromMainApplication(mainApplication, META_WALLET);
    }

    return config;
  });
};

const withStripe: ConfigPlugin<StripePluginProps> = (config, props) => {
  config = withStripeIos(config, props);
  // Add the custom scheme and meta on Android
  config = withStripeAndroid(config, props);
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

const withInAppPurchases: ConfigPlugin<Pick<StripePluginProps, 'merchantId'>> = (config, props) => {
  /**
   * Add the following to the entitlements:
   *
   * <key>com.apple.developer.in-app-payments</key>
   * <array>
   *	 <string>[MERCHANT_ID]</string>
   * </array>
   */
  return withEntitlementsPlist(config, config => {
    const key = 'com.apple.developer.in-app-payments';

    // @ts-ignore
    const merchants: string[] = config.modResults[key] ?? [];

    if (!merchants.includes(props.merchantId)) {
      merchants.push(props.merchantId);
    }

    config.modResults[key] = merchants;

    return config;
  });
};

export default createRunOncePlugin(withStripe, pkg.name, pkg.version);
