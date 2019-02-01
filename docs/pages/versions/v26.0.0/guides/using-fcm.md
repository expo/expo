---
title: Using FCM for Push Notifications
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Firebase Cloud Messaging is a popular option for delivering push notifications reliably. If you want your Expo Android app to get push notifications using your own FCM credentials, rather than our default option, you can do this with a couple of extra steps.

Note that FCM cannot be used to send messages to the Android Expo Client. Also, FCM is not currently available for Expo iOS apps.

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

Finally, make a new build of your app by running `exp build:android`.

## Uploading Server Credentials

In order for Expo to send notifications from our servers using your credentials, you'll need to upload your secret server key. You can find this key in the Firebase Console for your project:

1. At the top of the sidebar, click the **gear icon** to the right of **Project Overview** to go to your project settings.

2. Click on the **Cloud Messaging** tab in the Settings pane.

3. Copy the token listed next to **Server key**.

4. Run `exp push:android:upload --api-key <your-token-here>`, replacing `<your-token-here>` with the string you just copied. We'll store your token securely on our servers, where it will only be accessed when you send a push notification.

That's it -- users who run this new version of the app will now receive notifications through FCM using your project's credentials. You just send the push notifications as you normally would (see [guide](../push-notifications/#2-call-expos-push-api-with-the-users-token)). We'll take care of choosing the correct service to send the notification.
