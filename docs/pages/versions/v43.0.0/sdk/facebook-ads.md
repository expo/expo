---
title: FacebookAds
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-ads-facebook'
---

import { ConfigClassic, ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import { AndroidPermissions, IOSPermissions } from '~/components/plugins/permissions';
import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-ads-facebook`** provides access to the Facebook Audience SDK, allowing you to monetize your app with targeted ads.

<PlatformsSection android ios />

## Installation

<InstallSection packageName="expo-ads-facebook" />

For bare apps, you will also need to follow [Facebook's Get Started guide](https://developers.facebook.com/docs/audience-network/get-started).

## Configuration

### Creating the placement ID

You need to create a placement ID to display ads. Follow steps 1 and 3 from the [Getting Started Guide for Facebook Audience](https://developers.facebook.com/docs/audience-network/getting-started) to create the placement ID.

### Configuration in app.json / app.config.js

You can configure `expo-ads-facebook` using its built-in [config plugin](../../../guides/config-plugins.md) if you use config plugins in your project ([EAS Build](../../../build/introduction.md) or `expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

In your project's [app.json](../../../workflow/configuration.md), add your [Facebook App ID and Facebook Display Name](https://developers.facebook.com/docs/facebook-login/ios) under the `facebookAppId` and `facebookDisplayName` keys.

- In the Expo Go app, all of your Facebook API calls will be made with Expo's Facebook App ID. This means you will not see any related ad info in your Facebook developer page while running your project in Expo Go.
- To use your app's own Facebook App ID (and thus see any related ad info in your Facebook developer page), you'll need to [build a standalone app](../../../distribution/building-standalone-apps.md).

<ConfigClassic>

You can configure [the permissions for this library](#permissions) using [`ios.infoPlist`](../config/app.md#infoplist) and [`android.permissions`](../config/app.md#permissions).

</ConfigClassic>

<ConfigReactNative>

Learn how to configure the native projects in the [installation instructions in the `expo-ads-facebook` repository](https://github.com/expo/expo/tree/main/packages/expo-ads-facebook#installation-in-bare-react-native-projects).

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "facebookScheme": "fb1234567891234567",
    "facebookAppId": "1234567891234567",
    "facebookDisplayName": "My name",
    "facebookAutoLogAppEventsEnabled": true,
    "facebookAdvertiserIDCollectionEnabled": true,
    "plugins": [
      [
        "expo-ads-facebook",
        {
          "userTrackingPermission": "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[
{ name: 'userTrackingPermission', platform: 'ios', description: 'Sets the iOS `NSUserTrackingUsageDescription` permission message in Info.plist.', default: '"This identifier will be used to deliver personalized ads to you."' },
]} />

### Development vs Production

When using Facebook Ads in development, you can use Facebook's test ad IDs so that there's minimal setup needed on your part. Wherever a `placementId` is required, simply provide `DEMO_AD_TYPE#YOUR_PLACEMENT_ID` where `DEMO_AD_TYPE` is one of the values [shown here in the "Demo Ad Type Table"](https://developers.facebook.com/docs/audience-network/overview/in-house-mediation/server-to-server/testing/).

Another option is to add the following at the top of your file to register your device:

```js
import * as FacebookAds from 'expo-ads-facebook';

FacebookAds.AdSettings.addTestDevice(FacebookAds.AdSettings.currentDeviceHash);
```

You should see fake ads after you add this snippet.

To use Facebook Ads in production with real ads, you need to publish your app on Play Store or App Store and add your app in the Facebook console. Refer the [Submit Your App for Review section in the Getting Started Guide](https://developers.facebook.com/docs/audience-network/getting-started#onboarding) for more details.

## Usage

### Interstitial Ads

Interstitial Ad is a type of ad that displays a full-screen modal dialog with media content. It has a dismiss button as well as a touchable area that takes the user outside of your app to the advertised content.

Example:

```js
import * as FacebookAds from 'expo-ads-facebook';

FacebookAds.InterstitialAdManager.showAd(placementId)
  .then(didClick => {})
  .catch(error => {});
```

The method returns a promise that will be rejected when an error occurs during a call (e.g. no fill from ad server or network error) and resolved when the user either dismisses or interacts with the displayed ad.

### Native Ads

Native ads can be customized to match the design of your app. To display a native ad, you need to:

#### 1. Create NativeAdsManager instance

The `NativeAdManager` is responsible for fetching and caching ads as you request them.

```js
import * as FacebookAds from 'expo-ads-facebook';

const adsManager = new FacebookAds.NativeAdsManager(placementId, numberOfAdsToRequest);
```

The constructor accepts two parameters:

- `placementId` - which is a unique identifier describing your ad units
- `numberOfAdsToRequest` - which is a number of ads to request by ads manager at a time

#### 2. Wrap your component with `withNativeAd` HOC

Next, you need to wrap the component you want to use to show your add with the `withNativeAd` higher-order component. The wrapped component will receive a prop named `nativeAd`, which you can use to render an ad.

```js
import * as FacebookAds from 'expo-ads-facebook';

class AdComponent extends React.Component {
  render() {
    return (
      <View>
        <Text>{this.props.nativeAd.bodyText}</Text>
      </View>
    );
  }
}

export default FacebookAds.withNativeAd(AdComponent);
```

The `nativeAd` object can contain the following properties:

- `advertiserName` - The name of the Facebook Page or mobile app that represents the business running each ad.
- `headline` - The headline that the advertiser entered when they created their ad. This is usually the ad's main title.
- `linkDescription` - Additional information that the advertiser may have entered.
- `adTranslation` - The word 'ad', translated into the language based upon Facebook app language setting.
- `promotedTranslation` - The word 'promoted', translated into the language based upon Facebook app language setting.
- `sponsoredTranslation` - The word 'sponsored', translated into the language based upon Facebook app language setting.
- `bodyText` - Ad body
- `callToActionText` - Call to action phrase, e.g. - "Install Now"
- `socialContext` - social context for the Ad, for example "Over half a million users"

More information on how the properties correspond to an exemplary ad can be found in the official Facebook documentation for [Android](https://developers.facebook.com/docs/audience-network/android-native) and for [iOS](https://developers.facebook.com/docs/audience-network/ios-native).

#### 3. Add `AdMediaView` and `AdIconView` components

`AdMediaView` displays native ad media content whereas `AdIconView` is responsible for displaying an ad icon.

> ** Note: ** Don't use more than one `AdMediaView` and `AdIconView` component (each) within one native ad. If you use more, only the last mounted one will be populated with ad content.

```js
import * as FacebookAds from 'expo-ads-facebook';
const { AdIconView, AdMediaView } = FacebookAds;

class AdComponent extends React.Component {
  render() {
    return (
      <View>
        <AdMediaView />
        <AdIconView />
      </View>
    );
  }
}

export default FacebookAds.withNativeAd(AdComponent);
```

#### 4. Mark which components trigger the ad

> ** Note:** In order for elements wrapped with `AdTriggerView` to trigger the ad, you also must include `AdMediaView` in the children tree.

```js
import * as FacebookAds from 'expo-ads-facebook';
const { AdTriggerView, AdMediaView } = FacebookAds;

class AdComponent extends React.Component {
  render() {
    return (
      <View>
        <AdMediaView />
        <AdTriggerView>
          <Text>{this.props.nativeAd.bodyText}</Text>
        </AdTriggerView>
      </View>
    );
  }
}

export default FacebookAds.withNativeAd(AdComponent);
```

#### 5. Render the ad component

Now you can render the wrapped component and pass the `adsManager` instance you created earlier.

```js
class MyApp extends React.Component {
  render() {
    return (
      <View>
        <AdComponent adsManager={adsManager} />
      </View>
    );
  }
}
```

If you want, you can optionally pass two other callback properties — `onAdLoaded` and `onError`.

- `onAdLoaded` will be called once an ad is fetched and provided to your component (the `nativeAd` property introduced in step 2.) The one and only argument with which the function will be called will be the native ad object.
- `onError` will be called if the Audience framework encounters an error while fetching the ad. The one and only argument with which the function will be called will be an instance of `Error`.

```js
class MyApp extends React.Component {
  render() {
    return (
      <View>
        <AdComponent
          adsManager={adsManager}
          onAdLoaded={ad => console.log(ad)}
          onError={error => console.warn(error)}
        />
      </View>
    );
  }
}
```

### BannerAd

The `BannerAd` component allows you to display native as banners (known as _AdView_).

Banners are available in 3 sizes:

- `standard` (BANNER_HEIGHT_50)
- `large` (BANNER_HEIGHT_90)
- `rectangle` (RECTANGLE_HEIGHT_250)

#### 1. Showing ad

In order to show an ad, you first have to import `BannerAd` from the package:

```js
import * as FacebookAds from 'expo-ads-facebook';

function ViewWithBanner(props) {
  return (
    <View>
      <FacebookAds.BannerAd
        placementId="YOUR_BANNER_PLACEMENT_ID"
        type="standard"
        onPress={() => console.log('click')}
        onError={error => console.log('error', error)}
      />
    </View>
  );
}
```

## API

```js
import * as FacebookAds from 'expo-ads-facebook';
```

### NativeAdsManager

A wrapper for [`FBNativeAdsManager`](https://developers.facebook.com/docs/reference/ios/current/class/FBNativeAdsManager/). It provides a mechanism to fetch a set of ads and use them.

#### disableAutoRefresh

By default the native ads manager will refresh its ads periodically. This does not mean that any ads which are shown in the application's UI will be refreshed, but requesting next native ads to render may return new ads at different times.

```js
adsManager.disableAutoRefresh();
```

#### setMediaCachePolicy (iOS)

This controls which media from the native ads are cached before being displayed. The default is to not block on caching.

```js
adsManager.setMediaCachePolicy('none' | 'icon' | 'image' | 'all');
```

**Note:** This method is a no-op on Android

### InterstitialAdManager

InterstitialAdManager is a manager that allows you to display interstitial ads within your app.

#### showAd

Shows a fullscreen interstitial ad asynchronously.

```js
InterstitialAdManager.showAd('placementId')
  .then(...)
  .catch(...);
```

Promise will be rejected when there's an error loading ads from Facebook Audience network. It will resolve with a
`boolean` indicating whether user didClick an ad or not.

**Note:** There can be only one `showAd` call being performed at a time. Otherwise, an error will be thrown.

### AdSettings

AdSettings contains global settings for all ad controls.

#### requestPermissionsAsync

Asks for permissions to use data for tracking the user or the device.

> iOS: it requires the `NSUserTrackingUsageDescription` message added to the **Info.plist**.

**Returns**

A promise that resolves to an object of type [PermissionResponse](permissions.md#permissionresponse).

#### getPermissionsAsync

Checks application's permissions for using data for tracking the user or the device.

> iOS: it requires the `NSUserTrackingUsageDescription` message added to the **Info.plist**.

**Returns**

A promise that resolves to an object of type [PermissionResponse](permissions.md#permissionresponse).

#### currentDeviceHash

Constant which contains current device's hash.

#### addTestDevice

Registers given device to receive test ads. When you run app on simulator, it should automatically get added. Use it
to receive test ads in development mode on a standalone phone.

All devices should be specified before any other action takes place, like [`AdsManager`](#nativeadsmanager) gets created.

```js
FacebookAds.AdSettings.addTestDevice('hash');
```

#### clearTestDevices

Clears all previously set test devices. If you want your ads to respect newly set config, you'll have to destroy and create
an instance of AdsManager once again.

```js
FacebookAds.AdSettings.clearTestDevices();
```

### setAdvertiserTrackingEnabled (iOS)

Indicate to the Audience Network SDK if the user has consented to advertising tracking. This only applies to iOS 14+ and for all other versions "Limited Ad Tracking" is used. [Learn more](https://developers.facebook.com/docs/app-events/guides/advertising-tracking-enabled/).

```js
FacebookAds.AdSettings.setAdvertisingTrackingEnabled(true);
```

**Note:** This method is a no-op on Android and on iOS &lt;= 13.

#### setLogLevel (iOS)

Sets current SDK log level.

```js
FacebookAds.AdSettings.setLogLevel(
  'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification'
);
```

**Note:** This method is a no-op on Android.

#### setIsChildDirected

Configures the ad control for treatment as child-directed.

```js
FacebookAds.AdSettings.setIsChildDirected(true | false);
```

> This is called `setMixedAudience` in the underlying Android SDK.

#### setMediationService

If an ad provided service is mediating Audience Network in their SDK, it is required to set the name of the mediation service

```js
FacebookAds.AdSettings.setMediationService('foobar');
```

#### setUrlPrefix

Sets the URL prefix to use when making ad requests.

```js
FacebookAds.AdSettings.setUrlPrefix('...');
```

**Note:** This method should never be used in production

## Permissions

### Android

_No permissions required_.

### iOS

The following usage description keys are used by this library:

<IOSPermissions permissions={[ 'NSUserTrackingUsageDescription' ]} />

## Troubleshooting

Facebook provides a [table of common errors](https://developers.facebook.com/docs/audience-network/guides/test/checklist-errors/) when attempting to serve ads, this should be your first reference if you run into any issues.

There are also some changes with iOS 14 that impact the Audience Network's ability to serve ads. According to facebook, _["some iOS 14 users may not see any ads from Audience Network, while others may still see ads from us, but they'll be less relevant"](https://www.facebook.com/audiencenetwork/news-and-insights/preparing-audience-network-for-ios14)_.
