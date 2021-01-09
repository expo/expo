"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withStripeIos = exports.ensureStripeActivity = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { prefixAndroidKeys, getMainApplicationOrThrow, addMetaDataItemToMainApplication, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const pkg = require('expo-payments-stripe/package.json');
const CUSTOM_TAB_ACTIVITY = 'expo.modules.payments.stripe.RedirectUriReceiver';
const META_WALLET = 'com.google.android.gms.wallet.api.enabled';
function buildXMLItem({ head, children, }) {
    return { ...(children || {}), $: head };
}
function buildAndroidItem(name) {
    const item = typeof name === 'string' ? { name } : name;
    const head = prefixAndroidKeys(item);
    return buildXMLItem({ head });
}
// From Android.Facebook
function getStripeSchemeActivity(scheme) {
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
    });
}
function ensureStripeActivity({ mainApplication, scheme, }) {
    if (Array.isArray(mainApplication.activity)) {
        // Remove all Facebook CustomTabActivities first
        mainApplication.activity = mainApplication.activity.filter(activity => {
            return (activity.$ || {})['android:name'] !== CUSTOM_TAB_ACTIVITY;
        });
    }
    else {
        mainApplication.activity = [];
    }
    // If a new scheme is defined, append it to the activity.
    if (scheme) {
        mainApplication.activity.push(getStripeSchemeActivity(scheme));
    }
    return mainApplication;
}
exports.ensureStripeActivity = ensureStripeActivity;
exports.withStripeIos = (config, { scheme }) => {
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
const withStripeAndroid = (config, { scheme }) => {
    return config_plugins_1.withAndroidManifest(config, config => {
        let mainApplication = getMainApplicationOrThrow(config.modResults);
        mainApplication = ensureStripeActivity({ mainApplication, scheme });
        if (scheme) {
            addMetaDataItemToMainApplication(mainApplication, META_WALLET, 'true');
        }
        else {
            removeMetaDataItemFromMainApplication(mainApplication, META_WALLET);
        }
        return config;
    });
};
const withStripe = (config, { scheme }) => {
    config = exports.withStripeIos(config, { scheme });
    // Add the custom scheme and meta on Android
    config = withStripeAndroid(config, { scheme });
    return config;
};
const withStoreKit = config => {
    return config_plugins_1.withXcodeProject(config, config => {
        // TODO: Ensure framework doesn't already exist
        config_plugins_1.IOSConfig.XcodeUtils.addFramework({
            project: config.modResults,
            projectName: config.modRequest.projectName,
            framework: 'StoreKit.framework',
        });
        return config;
    });
};
exports.default = config_plugins_1.createRunOncePlugin(withStripe, pkg.name, pkg.version);
