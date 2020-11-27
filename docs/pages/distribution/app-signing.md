---
title: App Signing
---

Expo automates the process of signing your app for iOS and Android, but in both cases you can choose to provide your own overrides. Both `expo build:ios` and
`expo build:android` commands generate signed applications ready to be uploaded into respective stores.

On this page, we'll talk about the credentials that each platform requires. If you're curious about how we store your credentials on our end, take a look at our [security documentation](security.md).

## iOS

The 3 primary iOS credentials, all of which are associated with your Apple Developer account, are:

- Distribution Certificate
- Provisioning Profiles
- Push Notification Keys

Whether you let Expo handle all your credentials, or you handle them all yourself, it can be valuable to understand what each of these credentials mean, when and where they're used, and what happens when they expire or are revoked. You can inspect and manage all your credentials with Expo CLI by running `expo credentials:manager`.

### Distribution Certificate

The distribution certificate is all about you, the developer, and not about any particular app. You may only have one distribution certificate associated with your Apple Developer account.
This certificate will be used for all of your apps. If this certificate expires, your apps in production will not be affected. However, you will need to generate a new certificate if you want to upload new apps to the App Store, or update any of your existing apps. Deleting a distribution certificate has no effect on any apps already on the App Store. You can clear the distribution certificate Expo currently has stored for your app the next time you build by running `expo build:ios --clear-dist-cert`.

### Push Notification Keys

Apple Push Notification Keys (often abbreviated as APN keys) allow the associated apps to send and receive push notifications. By default, any app built with Expo will require an APN key. This is so that you can enable push notifications for your app through a quick [OTA update](../guides/configuring-ota-updates.md), rather than needing to submit an entirely new binary.

You can have a maximum of 2 APN keys associated with your Apple Developer account, and a single key can be used with any number of apps. If you revoke an APN key, all apps that rely on that key will no longer be able to send or receive push notifications until you upload a new key to replace it. Uploading a new APN key **will not** change your users' [Expo Push Tokens](../versions/latest/sdk/notifications.md#notificationsgetexpopushtokenasync). Push notification keys do not expire. You can clear the APN key Expo currently has stored for your app the next time you build by running `expo build:ios --clear-push-key`.

### Provisioning Profiles

Each profile is app-specific, meaning you will have a provisioning profile for every app you submit to the App Store. These provisioning profiles are associated with your distribution certificate, so if that is revoked or expired, you'll need to regenerate the app's provisioning profile, as well. Similar to the distribution certificate, revoking your app's provisioning profile will not have any effect on apps already on the App Store.

Provisioning profiles expire after 12 months, but this won't affect apps in production. You will just need to create a new one the next time you build your app by running `expo build:ios --clear-provisioning-profile`.

### Summary

| Credential               | Limit Per Account | App-specific? | Can be revoked with no production side effects? | Used at... |
| ------------------------ | ----------------- | ------------- | ----------------------------------------------- | ---------- |
| Distribution Certificate | 2                 | ❌            | ✅                                              | Build time |
| Push Notification Key    | 2                 | ❌            | ❌                                              | Run time   |
| Provisioning Profile     | Unlimited         | ✅            | ✅                                              | Build time |

### Clearing Credentials

When you use the `expo credentials:manager` or `expo build:ios --clear-credentials` commands to delete your credentials, this only removes those credentials from Expo's servers, **it does not delete the credentials from Apple's perspective**. This means that to fully delete your credentials (let's say, because you want a new push notification key but you already have 2), you'll need to do so from the [Apple Developer Console](https://developer.apple.com/account/resources/certificates/list).

## Android

Google requires all Android apps to be digitally signed with a certificate before they are installed on a device or updated. Usually
a private key and its public certificate are stored in a keystore. In the past, APKs uploaded to the store were required to be signed with
the **app signing certificate** (certificate that will be attached to the app in the Play Store), and if the keystore was lost there was no way to
recover or reset it. Now, you can opt in to App Signing by Google Play and simply upload an APK signed with an **upload certificate**, and Google Play will automatically replace it with the **app signing certificate**. Both the old method (app signing certificate) and new method (upload certificate) are essentially the same mechanism, but using the new method, if your upload keystore is lost or compromised, you can contact the Google Play support team to reset the key.

From the Expo build process's perspective, there is no difference whether an app is signed with an **upload certificate** or an **app signing key**. Either way, `expo build:android` will generate an APK signed with the keystore currently associated with your application. If you want to generate an upload keystore manually, you can do that the same way you created your original keystore.

See [here](https://developer.android.com/studio/publish/app-signing) to find more information about this process.

### App signing by Google Play

When you [upload your first release to Google Play](https://github.com/expo/fyi/blob/master/first-android-submission.md) you will see a notice about "App signing by Google Play" and "Google is protecting your app signing key". This is the default behavior and requires no action on your behalf except to press "Continue".

> If you lose your upload keystore (or it's compromised), you must ask the Google Support Team to reset your upload key.

If you currently manage your app signing key and want Google to manage it for you, read ["Use app signing by Google Play"](https://support.google.com/googleplay/android-developer/answer/9842756).