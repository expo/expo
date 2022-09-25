---
title: MapView
sourceCodeUrl: 'https://github.com/react-native-maps/react-native-maps'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`react-native-maps`** provides a Map component that uses Apple Maps or Google Maps on iOS and Google Maps on Android. Expo uses react-native-maps at [react-community/react-native-maps](https://github.com/react-community/react-native-maps). No setup required for use within the Expo Go app. See below for instructions on how to configure for deployment as a standalone app on Android and iOS.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="react-native-maps" href="https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md" />

## Usage

See full documentation at [react-native-maps/react-native-maps](https://github.com/react-native-maps/react-native-maps).

<SnackInline label='MapView' dependencies={['react-native-maps']}>

```jsx
import * as React from 'react';
import MapView from 'react-native-maps';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <MapView style={styles.map} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
```

</SnackInline>

## Configuration

No additional configuration is necessary to use `react-native-maps` in Expo Go. However, once you want to deploy your standalone app you should follow instructions below.

## Deploying Google Maps to an Android standalone app

> If you've already registered a project for another Google service on Android, such as Google Sign In, you enable the **Maps SDK for Android** on your project and jump to step 4.

#### 1. Register a Google Cloud API project and enable the Maps SDK for Android

- Open your browser to the [Google API Manager](https://console.developers.google.com/apis) and create a project.
- Once it's created, go to the project and enable the **Maps SDK for Android**

#### 2. Have your app's SHA-1 certificate fingerprint ready

- **If you are deploying your app to the Google Play Store**, you will need to have [created a standalone app](../../../distribution/building-standalone-apps.md) and [uploaded it to Google Play](../../../distribution/app-stores.md) at least once in order to have Google generate your app signing credentials.
  - Go to the [Google Play Console](https://play.google.com/console) → (your app) → Setup → App Integrity
  - Copy the value of _SHA-1 certificate fingerprint_
- **If you are sideloading your APK or deploying it to another store**, you will need to have [created a standalone app](../../../distribution/building-standalone-apps.md), then run `expo fetch:android:hashes` and copy the _Google Certificate Fingerprint_.

#### 3. Create an API key

- Go to [Google Cloud Credential manager](https://console.cloud.google.com/apis/credentials) and click **Create Credentials**, then **API Key**.
- In the modal, click **Restrict Key**.
- Under **Key restrictions** → **Application restrictions**, ensure that the **Android apps** radio button is chosen.
- Click the **+ Add package name and fingerprint** button.
- Add your Android package name from **app.json** to the package name field.
- Add or replace the **SHA-1 certificate fingerprint** with the value from step 2.
- Click **Done** and then click **Save**

#### 4. Add the API key to your project

- Copy your **API Key** into your **app.json** under the `android.config.googleMaps.apiKey` field.
- Rebuild the app binary and re-submit to Google Play or sideload it (depending on how you configured your API key) to test that the configuration was successful.

## Deploying Google Maps to an iOS standalone app

> If you've already registered a project for another Google service on iOS, such as Google Sign In, you enable the **Maps SDK for iOS** on your project and jump to step 3.

#### 1. Register a Google Cloud API project and enable the Maps SDK for iOS

- Open your browser to the [Google API Manager](https://console.developers.google.com/apis) and create a project.
- Once it's created, go to the project and enable the **Maps SDK for iOS**

#### 2. Create an API key

- Go to [Google Cloud Credential manager](https://console.cloud.google.com/apis/credentials) and click **Create Credentials**, then **API Key**.
- In the modal, click **Restrict Key**.
- Choose the **iOS apps** radio button under **Key restriction**.
- Under **Accept requests from an iOS application with one of these bundle identifiers**, click the **Add an item** button.
- Add your `ios.bundleIdentifier` from **app.json** eg: `com.company.myapp`) to the bundle ID field.
- Click **Done** and then click **Save**

#### 3. Add the API key to your project

- Copy your API key into **app.json** under the `ios.config.googleMapsApiKey` field.
- In your code, import `{ PROVIDER_GOOGLE }` from `react-native-maps` and add the property `provider=PROVIDER_GOOGLE` to your `<MapView>`. This property works on both iOS and Android.
- Rebuild the app binary. An easy way to test that the configuration was successful is to do a simulator build.

## Configuring for web

> Web is experimental! We do not recommend using this library on web yet.

To use this in web, add the following script to your **web/index.html**. This script may already be present, if this is the case, just replace the `API_KEY` with your Google Maps API key which you can obtain here: [Google Maps: Get API key](https://developers.google.com/maps/documentation/javascript/get-api-key)

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
    />
    <!-- Use your web API Key in place of API_KEY: https://developers.google.com/maps/documentation/javascript/get-api-key -->
  </head>
  <body />
</html>
```
