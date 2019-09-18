---
title: MapView
---

import SnackEmbed from '~/components/plugins/SnackEmbed';

A Map component that uses Apple Maps or Google Maps on iOS and Google Maps on Android. Expo uses react-native-maps at [react-community/react-native-maps](https://github.com/react-community/react-native-maps). No setup required for use within the Expo app, or within a standalone app for iOS. See below for instructions on how to configure for deployment as a standalone app on Android.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-maps`. In bare apps, also follow the [react-native-maps linking and configuration instructions](https://github.com/react-native-community/react-native-maps).

## Usage

See full documentation at [react-community/react-native-maps](https://github.com/react-community/react-native-maps).

<SnackEmbed snackId="@charliecruzan/basicmapviewexample" />

## Configuration

### Deploying to a standalone app on Android

If you have already integrated Google Sign In into your standalone app, this is very easy. Otherwise, there are some additional steps.

- **If you already have Google Sign In configured**
  1.  Open your browser to the [Google API Manager](https://console.developers.google.com/apis).
  2.  Select your project and enable the **Google Maps SDK for Android**
  3.  In `app.json`, copy the API key from `android.config.googleSignIn` to `android.config.googleMaps.apiKey`.
  4.  Rebuild your standalone app.
- **If you already have not configured Google Sign In**
  1.  Build your app, take note of your Android package name (eg: `ca.brentvatne.growlerprowler`)
  2.  Open your browser to the [Google API Manager](https://console.developers.google.com/apis) and create a project.
  3.  Once it's created, go to the project and enable the **Google Maps SDK for Android**
  4.  Go back to <https://console.developers.google.com/apis/credentials> and click **Create Credentials**, then **API Key**.
  5.  In the modal that popped up, click **RESTRICT KEY**.
  6.  Choose the **Android apps** radio button under **Key restriction**.
  7.  Click the **+ Add package name and fingerprint** button.
  8.  Add your `android.package` from `app.json` (eg: `ca.brentvatne.growlerprowler`) to the Package name field.
  9.  Run `expo fetch:android:hashes`.
  10. Copy `Google Certificate Fingerprint` from the output from step 9 and insert it in the "SHA-1 certificate fingerprint" field.
  11. Copy the API key (the first text input on the page) into `app.json` under the `android.config.googleMaps.apiKey` field. [See an example diff](https://github.com/brentvatne/growler-prowler/commit/3496e69b14adb21eb2025ef9e0719c2edbef2aa2).
  12. Press `Save` and then rebuild the app like in step 1.

**Note:** The API key can be accessed through your app's [Constants](../../sdk/constants#constantsmanifest) (via `Constants.manifest.android.config.googleMaps.apiKey`) if you'd prefer not to have it in your code directly.

**Note:** If you've enabled Google Play's app signing service, you will need to grab their app signing certificate in production rather than the upload certificate returned by `expo fetch:android:hashes`. You can do this by grabbing the signature from Play Console -> Your App -> Release management -> App signing, and then going to the [API Dashboard](https://console.developers.google.com/apis/) -> Credentials and adding the signature to your existing credential.

### Deploying Google Maps to a standalone app on iOS

Apple Maps should just work with no extra configuration. For Google Maps, you can specify your own Google Maps API key using the `ios.config.googleMapsApiKey` [configuration](../../workflow/configuration#ios) in your project's app.json. **Note:** This can also be accessed through your app's [Constants](../../sdk/constants#constantsmanifest) (via `Constants.manifest.ios.config.googleMapsApiKey`) if you'd prefer not to have the API key in your code.

### Deploying Google Maps to ExpoKit for iOS

If you want to add MapView with Google Maps to an [ExpoKit](../../expokit/overview/) (ejected) project on iOS, you may need to manually provide a key by calling:

```
[GMSServices provideApiKey:@"your api key"]
```

Alternatively, you can provide the `GMSApiKey` key in your app's `Info.plist` and ExpoKit will pick it up automatically. If you ejected after already configuring Google Maps, the eject step may have already provided this for you.

### Web Setup

> Web is experimental! You may need to add the web target to your Expo app.

To use this in web, add the following script to your `web/index.html`. This script may already be present, if this is the case, just replace the `API_KEY` with your Google Maps API key which you can obtain here: [Google Maps: Get API key](https://developers.google.com/maps/documentation/javascript/get-api-key)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- At the end of the <head/> element... -->

    <script
      async
      defer
      src="https://maps.googleapis.com/maps/api/js?key=API_KEY"
      type="text/javascript"
    ></script>

    <!-- Use your web API Key in place of API_KEY: https://developers.google.com/maps/documentation/javascript/get-api-key -->
  </head>

  <!-- <body /> -->
</html>
```
