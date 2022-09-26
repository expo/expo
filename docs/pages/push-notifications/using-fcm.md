---
title: Using FCM for Push Notifications
sidebar_title: Using FCM
---

**Firebase Cloud Messaging is required for all Android apps using Expo SDK**, unless you're still running your app in the Expo Go app. To set up your Expo Android app to get push notifications using your own FCM credentials, follow this guide closely.

Note that FCM is not currently available for `expo-notifications` on iOS.

## Client Setup

1. If you have not already created a Firebase project for your app, do so now by clicking on **Add project** in the [Firebase Console](https://console.firebase.google.com/).

2. In your new project console, click **Add Firebase to your Android app** and follow the setup steps. **Make sure that the Android package name you enter is the same as the value of `android.package` in your app.json.**

3. Download the `google-services.json` file and place it in your app's root directory.
  > **Note:** The `google-services.json` file contains unique and non-secret identifiers of your Firebase project. For more information, see [Understand Firebase Projects](https://firebase.google.com/docs/projects/learn-more#config-files-objects).
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

5. Confirm that your API key in `google-services.json` has the correct "API restrictions" in the [Google Cloud Platform API Credentials console](https://console.cloud.google.com/apis/credentials). For push notifications to work correctly, Firebase requires the API key to either be unrestricted (the key can call any API), or have access to both `Firebase Cloud Messaging API` and `Firebase Installations API`. The API key can be found under the `client.api_key.current_key` field in `google-services.json`.

  ```javascript
  {
    ...
    "client": [
      {
        "api_key": [
          {
            "current_key" "<your Google Cloud Platform API key>",
          }
        ],
      }
    ]
  }
  ```

  > **Note:** Firebase will create an API key in the Google Cloud Platform console with a name like `Android key (auto created by Firebase)`. **This is not always the same key as the one found in `google-services.json`. Always confirm your key and associated restrictions in the Google Cloud Platform console.**

6. Finally, make a new build of your app by running `eas build --platform android` (or `expo build:android` if you're using the classic build system).

### Bare projects

If you do the above setup before ejecting to bare, your FCM notifications will continue to work properly without any extra steps after ejecting. However, if your project is already ejected to bare and you want to set up FCM retroactively, you'll need to:

- [Set up Firebase in your Android project](/guides/setup-native-firebase/#android-1)
- Copy the same `google-services.json` file into the `android/app` directory. If that file already exists, you should overwrite it.

## Uploading Server Credentials

In order for Expo to send notifications from our servers using your credentials, you'll need to upload your secret server key. You can find this key in the Firebase Console for your project:

1. At the top of the sidebar, click the **gear icon** to the right of **Project Overview** to go to your project settings.

2. Click on the **Cloud Messaging** tab in the Settings pane.

3. Copy the token listed next to **Server key**.

> **Note:** Server Key is only available in **Cloud Messaging API (Legacy)**, which may be Disabled by default. Enable it by clicking the 3-dot menu > Manage API in Google Cloud Console and follow the flow there. Once the legacy messaging API is enabled, you should see Server Key in that section.

4. Run `expo push:android:upload --api-key <your-token-here>`, replacing `<your-token-here>` with the string you just copied. We'll store your token securely on our servers, where it will only be accessed when you send a push notification.

That's it -- users who run this new version of the app will now receive notifications through FCM using your project's credentials. You just send the push notifications as you normally would (see [guide](sending-notifications.md)). We'll take care of choosing the correct service to send the notification.

## See also

- Having trouble? Visit [Expo's notification FAQ page](./faq.md)
