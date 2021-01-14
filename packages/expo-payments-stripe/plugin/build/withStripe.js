"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withStripeIos = exports.ensureStripeActivity = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { prefixAndroidKeys, getMainApplicationOrThrow, addMetaDataItemToMainApplication, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const pkg = require('expo-payments-stripe/package.json');
const CUSTOM_TAB_ACTIVITY = 'expo.modules.payments.stripe.RedirectUriReceiver';
const META_WALLET = 'com.google.android.gms.wallet.api.enabled';
function buildXMLItem({ head, children = {}, }) {
    return { ...children, $: head };
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
            var _a;
            return ((_a = activity.$) === null || _a === void 0 ? void 0 : _a['android:name']) !== CUSTOM_TAB_ACTIVITY;
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
exports.withStripeIos = (config, { scheme, merchantId }) => {
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
const withStripe = (config, props) => {
    config = exports.withStripeIos(config, props);
    // Add the custom scheme and meta on Android
    config = withStripeAndroid(config, props);
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
const withInAppPurchases = (config, props) => {
    /**
     * Add the following to the entitlements:
     *
     * <key>com.apple.developer.in-app-payments</key>
     * <array>
     *	 <string>[MERCHANT_ID]</string>
     * </array>
     */
    return config_plugins_1.withEntitlementsPlist(config, config => {
        var _a;
        const key = 'com.apple.developer.in-app-payments';
        // @ts-ignore
        const merchants = (_a = config.modResults[key]) !== null && _a !== void 0 ? _a : [];
        if (!merchants.includes(props.merchantId)) {
            merchants.push(props.merchantId);
        }
        config.modResults[key] = merchants;
        return config;
    });
};
exports.default = config_plugins_1.createRunOncePlugin(withStripe, pkg.name, pkg.version);
