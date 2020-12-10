---
title: Using FCM for Push Notifications
sidebar_title: Using FCM
---

**Firebase Cloud Messaging is required for all managed and bare workflow Android apps made with Expo**, unless you're still running your app in the Expo client. To set up your Expo Android app to get push notifications using your own FCM credentials, follow this guide closely.

Note that FCM is not currently available for Expo iOS apps.

## Client Setup

1. If you have not already created a Firebase project for your app, do so now by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).

2. In your new project console, click **Add Firebase to your Android app** and follow the setup steps. **Make sure that the Android package name you enter is the same as the value of `android.package` in your app.json.**

3. Download the `google-services.json` file and place it in your Expo app's root directory.

4. In your app.json, add an `android.googleServicesFile` field with the relative path to the `google-services.json` file you just downloaded. If you placed it in the root directory, this will probably look like

```javascript
{
  ...
  "android": {
    "googleServicesFile": "./google-services.json",
    ...
  }
}
```

Finally, make a new build of your app by running `expo build:android`.

### Bare projects

If you do the above setup before ejecting to bare, your FCM notifications will continue to work properly without any extra steps after ejecting. However, if your project is already ejected to bare and you want to set up FCM retroactively, you'll need to:

- [Set up Firebase in your Android project](https://docs.expo.io/guides/setup-native-firebase/#android-1)
- Copy the same `google-services.json` file into the `android/app` directory. If that file already exists, you should overwrite it.

## Uploading Server Credentials

In order for Expo to send notifications from our servers using your credentials, you'll need to upload your secret server key. You can find this key in the Firebase Console for your project:

1. At the top of the sidebar, click the **gear icon** to the right of **Project Overview** to go to your project settings.

2. Click on the **Cloud Messaging** tab in the Settings pane.

3. Copy the token listed next to **Server key**.

4. Run `expo push:android:upload --api-key <your-token-here>`, replacing `<your-token-here>` with the string you just copied. We'll store your token securely on our servers, where it will only be accessed when you send a push notification.

That's it -- users who run this new version of the app will now receive notifications through FCM using your project's credentials. You just send the push notifications as you normally would (see [guide](sending-notifications.md)). We'll take care of choosing the correct service to send the notification.
