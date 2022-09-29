---
title: Deep linking
---

import { ConfigReactNative } from '~/components/plugins/ConfigSection';
import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

It is often desirable for regular HTTPS links (without a custom URL scheme) to directly open your app on mobile devices. This allows you to send notification emails with links that work as expected in a web browser on desktop, while opening the content in your app on mobile. iOS refers to this concept as "universal links" while Android calls it "deep links" (but in this section, we are specifically discussing deep links that do not use a custom URL scheme).

> Deferred deep links can be implemented with [`react-native-branch`](https://github.com/expo/config-plugins/tree/main/packages/react-native-branch).

### Universal links on iOS

#### AASA configuration

To implement universal links on iOS, you must first set up verification that you own your domain. This is done by serving an Apple App Site Association (AASA) file from your webserver.

The AASA must be served from `/.well-known/apple-app-site-association` (with no extension). The AASA contains JSON which specifies your Apple app ID and a list of paths on your domain that should be handled by your mobile app. For example, if you want links of the format `https://www.myapp.io/records/123` to be opened by your mobile app, your AASA would have the following contents:

```json
{
  "applinks": {
    "apps": [], // This is usually left empty, but still must be included
    "details": [
      {
        "appID": "LKWJEF.io.myapp.example",
        "paths": ["/records/*"]
      }
    ]
  }
}
```

This tells iOS that any links to `https://www.myapp.io/records/*` (with wildcard matching for the record ID) should be opened directly by the app with ID `LKWJEF.io.myapp.example`. See [Apple's documentation](https://developer.apple.com/documentation/bundleresources/applinks) for further details on the format of the AASA. Branch provides an [AASA validator](https://branch.io/resources/aasa-validator/) which can help you confirm that your AASA is correctly deployed and has a valid format.

> The `*` wildcard does **not** match domain or path separators (periods and slashes).

As of iOS 13, [a new `details` format is supported](https://developer.apple.com/documentation/xcode/supporting-associated-domains) which allows you to specify

- `appIDs` instead of `appID`, which makes it easier to associate multiple apps with the same configuration
- an array of `components`, which allows you to specify fragments, exclude specific paths, and add comments

<Collapsible summary="Here's the example AASA json from Apple's documentation">

```json
{
  "applinks": {
  "details": [
    {
      "appIDs": [ "ABCDE12345.com.example.app", "ABCDE12345.com.example.app2" ],
      "components": [
         {
            "#": "no_universal_links",
            "exclude": true,
            "comment": "Matches any URL whose fragment equals no_universal_links and instructs the system not to open it as a universal link"
         },
         {
            "/": "/buy/*",
            "comment": "Matches any URL whose path starts with /buy/"
         },
         {
            "/": "/help/website/*",
            "exclude": true,
            "comment": "Matches any URL whose path starts with /help/website/ and instructs the system not to open it as a universal link"
         },
         {
            "/": "/help/*",
            "?": { "articleNumber": "????" },
            "comment": "Matches any URL whose path starts with /help/ and which has a query item with name 'articleNumber' and a value of exactly 4 characters"
        }
      ]
    }
  ]
}
```

</Collapsible>

To support all iOS versions, you can provide both the above formats in your `details` key, but we recommend placing the configuration for more recent iOS versions first.

Note that iOS will download your AASA when your app is first installed and when updates are installed from the App Store, but it will not refresh any more frequently. If you wish to change the paths in your AASA for a production app, you will need to issue a full update via the App Store so that all of your users' apps re-fetch your AASA and recognize the new paths.

#### Expo configuration

After deploying your AASA, you must also configure your app to use your associated domain:

Add [`expo.ios.associatedDomains`](/versions/latest/config/app/#associateddomains) to your Expo config (**app.json**, **app.config.js**), and make sure to follow [Apple's specified format](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_associated-domains). Make sure _not_ to include the protocol (`https`) in your URL, this is a common mistake that will result in your universal links not working.

For example, if my website is `https://expo.dev/`, the app links would look like:

`app.json`

```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:expo.dev"]
    }
  }
}
```

<ConfigReactNative title="Are you using this feature in a bare React Native app?">

Apps that don't use [EAS Build](/build/introduction) must [manually configure](/build-reference/ios-capabilities#manual-setup) the **Associated Domains** capability for their bundle identifier.

If you enable through the [Apple Developer Console](/build-reference/ios-capabilities#apple-developer-console), then be sure to add the following entitlements in your `ios/[app]/[app].entitlements` file:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:expo.dev</string>
</array>
```

</ConfigReactNative>

At this point, opening a link on your mobile device should now open your app! If it doesn't, re-check the previous steps to ensure that your AASA is valid, the path is specified in the AASA, and you have correctly configured your App ID in the [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list). Once you've got your app opening, move to the [Handling links into your app](#handling-links) section for details on how to handle the inbound link and show the user the content they requested.

### Deep links on Android

Implementing deep links on Android (without a custom URL scheme) is somewhat simpler than on iOS. You simply need to add `intentFilters` to the [Android section](/versions/latest/config/app/#android) of your Expo config (**app.json**, **app.config.js**). The following basic configuration will cause your app to be presented in the standard Android dialog as an option for handling any record links to `myapp.io`:

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "*.myapp.io",
              "pathPrefix": "/records"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

It may be desirable for links to your domain to always open your app (without presenting the user a dialog where they can choose the browser or a different handler). You can implement this with Android App Links, which use a similar verification process as Universal Links on iOS. First, you must publish a JSON file at `/.well-known/assetlinks.json` specifying your app ID and which links should be opened by your app. See [Android's documentation](https://developer.android.com/training/app-links/verify-site-associations) for details about formatting this file. Second, add `"autoVerify": true` to the intent filter in your Expo config (**app.json**, **app.config.js**); this tells Android to check for your **assetlinks.json** on your server and register your app as the automatic handler for the specified paths:

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "*.myapp.io",
              "pathPrefix": "/records"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Handling App Links on Android with expo-dev-client

From Android 12 onwards, there is an issue reported when verifying the App Links with [`expo-dev-client`](/development/getting-started/).

When `expo.android.intentFilters` is used and `"autoVerify"` is set to `true`, the `expo-dev-client` adds a scheme `<data android:scheme="exp+<slug>" />` to the intent filter. This scheme breaks the App Links verification.

An example of the `exp+` scheme breaking the verification process:

```xml
<activity android:name=".MainActivity" android:label="@string/app_name" android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode" android:launchMode="singleTask" android:windowSoftInputMode="adjustResize" android:theme="@style/Theme.App.SplashScreen" android:screenOrientation="portrait">
  <intent-filter>
    <action android:name="android.intent.action.MAIN"/>
    <category android:name="android.intent.category.LAUNCHER"/>
  </intent-filter>
  <intent-filter>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="<slug>"/>
    <data android:scheme="<package>"/>
    <data android:scheme="exp+<slug>"/>
  </intent-filter>
  <intent-filter android:autoVerify="true" data-generated="true">
    <action android:name="android.intent.action.VIEW"/>
    <data android:scheme="https" android:host="<name>.onelink.me" android:pathPrefix="/XXXX"/>
    <data android:scheme="https" android:host="<name>.onelink.me" android:pathPrefix="/XXXX"/>
    <data android:scheme="https" android:host="<name>.onelink.me" android:pathPrefix="/XXXX"/>
    <!-- @info -->
    <data android:scheme="exp+<slug>"/>
    <!-- @end -->
    <category android:name="android.intent.category.BROWSABLE"/>
    <category android:name="android.intent.category.DEFAULT"/>
  </intent-filter>
</activity>
```

You can fix this issue by creating a custom [Config Plugin](/guides/config-plugins/) that removes the `exp+` schemes when verifying `intentFilters`.

Create a new file called **withAndroidVerifiedLinksWorkaround.js** in your project with the following code snippet:

```javascript
const { createRunOncePlugin, withAndroidManifest } = require('@expo/config-plugins');

/**
 * @typedef {import('@expo/config-plugins').ConfigPlugin} ConfigPlugin
 * @typedef {import('@expo/config-plugins').AndroidManifest} AndroidManifest
 */

/**
 * Remove the custom Expo dev client scheme from intent filters, which are set to `autoVerify=true`.
 * The custom scheme `<data android:scheme="exp+<slug>"/>` seems to block verification for these intent filters.
 * This plugin makes sure there is no scheme in the autoVerify intent filters, that starts with `exp+`.
 *
 * @type {ConfigPlugin}
 */
const withAndroidVerifiedLinksWorkaround = config =>
  withAndroidManifest(config, config => {
    config.modResults = removeExpoSchemaFromVerifiedIntentFilters(config.modResults);
    return config;
  });

/**
 * Iterate over all `autoVerify=true` intent filters, and pull out schemes starting with `exp+`.
 *
 * @param {AndroidManifest} androidManifest
 */
function removeExpoSchemaFromVerifiedIntentFilters(androidManifest) {
  for (const application of androidManifest.manifest.application || []) {
    for (const activity of application.activity || []) {
      if (activityHasSingleTaskLaunchMode(activity)) {
        for (const intentFilter of activity['intent-filter'] || []) {
          if (intentFilterHasAutoVerification(intentFilter) && intentFilter?.data) {
            intentFilter.data = intentFilterRemoveSchemeFromData(intentFilter, scheme =>
              scheme?.startsWith('exp+')
            );
          }
        }
        break;
      }
    }
  }

  return androidManifest;
}

/**
 * Determine if the activity should contain the intent filters to clean.
 *
 */
function activityHasSingleTaskLaunchMode(activity) {
  return activity?.$?.['android:launchMode'] === 'singleTask';
}

/**
 * Determine if the intent filter has `autoVerify=true`.
 */
function intentFilterHasAutoVerification(intentFilter) {
  return intentFilter?.$?.['android:autoVerify'] === 'true';
}

/**
 * Remove schemes from the intent filter that matches the function.
 */
function intentFilterRemoveSchemeFromData(intentFilter, schemeMatcher) {
  return intentFilter?.data?.filter(entry => !schemeMatcher(entry?.$['android:scheme'] || ''));
}

module.exports = createRunOncePlugin(
  withAndroidVerifiedLinksWorkaround,
  'withAndroidVerifiedLinksWorkaround',
  '1.0.0'
);
```

Next, in you **app.json**, add this plugin under `expo.plugins`:

```json
{
  "plugins": ["./plugins/withAndroidVerifiedLinksWorkaround"]
}
```

If you are using [EAS Build](/build/introduction/), you will have to create a new build after adding these changes to your project so that they are reflected in your Android app.

## When to _not_ use deep links

This is the easiest way to set up deep links into your app because it requires a minimal amount of configuration.

The main problem is that if the user does not have your app installed and follows a link to your app with its custom scheme, their operating system will indicate that the page couldn't be opened but not give much more information. This is not a great experience. There is no way to work around this in the browser.

Additionally, many messaging apps do not autolink URLs with custom schemes -- for example, `exp://u.expo.dev/[project-id]?channel-name=[channel-name]&runtime-version=[runtime-version]` might just show up as plain text in your browser rather than as a link ([exp://u.expo.dev/[project-id]?channel-name=[channel-name]&runtime-version=[runtime-version]](#)).

An example of this is Gmail which strips the href property from links of most apps, a trick to use is to link to a regular https url instead of your app's custom scheme, this will open the user's web browser. Browsers do not usually strip the href property so you can host a file online that redirects the user to your app's custom schemes.

Instead of linking to `example://path/into/app`, you could link to `https://example.com/redirect-to-app.html` and `redirect-to-app.html` would contain the following code:

```javascript
<script>window.location.replace("example://path/into/app");</script>
```
