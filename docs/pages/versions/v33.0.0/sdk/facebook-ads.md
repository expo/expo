---
title: FacebookAds
---

**Facebook Audience SDK** integration.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-ads-facebook`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-ads-facebook).

> **Note**: Not compatible with web.

## Configuration

### Creating the placement ID

You need to create a placement ID to display ads. Follow steps 1 and 3 from the [Getting Started Guide for Facebook Audience](https://developers.facebook.com/docs/audience-network/getting-started) to create the placement ID.

### Configuring app.json

In your project's [app.json](../../workflow/configuration/), add your [Facebook App ID and Facebook Display Name](https://developers.facebook.com/docs/facebook-login/ios) under the `facebookAppId` and `facebookDisplayName` keys.

### Development vs Production

When using Facebook Ads in development, you'll need to register your device to be able to show ads. You can add the following at the top of your file to register your device:

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

The method returns a promise that will be rejected when an error occurs during a call (e.g. no fill from ad server or network error) and resolved when the user either dimisses or interacts with the displayed ad.

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

#
