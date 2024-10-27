---
title: Security
description: Learn how credentials and other sensitive data are handled when using EAS.
---

Before you enter outside credentials or provide other sensitive data to third-party software you should ask yourself whether you trust the software to use it responsibly and protect it. Due to the nature of what goes into building an app binary for distribution on app stores, the Expo standalone app build service requires various pieces of information with varying degrees of sensitivity. This document explains what those are, how we store them, and what could go wrong if they were to be compromised.

Most data stored by Expo servers (credentials or otherwise) is encrypted at rest by our cloud provider, Google Cloud. Credentials are additionally encrypted using [KMS](https://cloud.google.com/security/products/security-key-management). Credentials are only unencrypted for as long as we need them in memory in the standalone app builders or push notification services. Credentials are always encrypted in our databases, message queues, and other less transient parts of the system.

All of the data related to the information explained below can be downloaded and removed from Expo servers (if it is stored there at all in the first place), and some of it may be available through other locations such as the Apple Developer Portal.

## Android Push Notification credentials

Android uses Firebase Cloud Messaging (FCM) for push notifications. If you build a standalone app with Expo we store your FCM server key for you.

### Consequences if compromised

Each FCM server key can send push notifications to any of the Android apps associated with the Firebase project to which the key belongs. A malicious actor would need to have access to the FCM server key and device tokens to send a notification.

You can create and delete server keys through the Firebase console. When you delete a key, notifications using that key will stop working. When you create a new one and upload it to Expo, notifications will resume working.

### Consequences if lost

None. You can access it through the Firebase console.

## Android build credentials

A keystore and keystore password are required to sign a build for release to the Play Store. These are encrypted with KMS and additionally at rest. After an app is first submitted to the Google Play Store, the same keystore must be used to sign the app again to update it. It proves that the APK came from the developer who owns the keystore. The keystore alone doesn't let you submit to Google Play &mdash; your Google account needs access to the Google Play Console as well.

### Consequences if compromised

Provided that your Google Play Developer account is secure, a malicious actor will not be able to update your app with your keystore and keystore password. You cannot change your keystore.

### Consequences if lost

You will not be able to update your app on Google Play. You may want to download and backup the keystore and keystore password in a secure location of your choosing or in Google Play with the App Signing feature.

## Google Developer credentials

Expo tools never ask you to provide your Google account credentials.

## Android submit credentials

### Google Service Account Key

Google Service Account Key is the authentication method used to submit an Android app to the Google Play Store with EAS Submit. This key is stored on Expo servers and encrypted using [KMS](https://cloud.google.com/security/products/security-key-management) when at rest. The key will remain on Expo servers to be re-used for subsequent submissions, and it can be removed at any time by a user with the requisite permissions.

#### Consequences if compromised

If a malicious actor somehow gains access to your Google Service Account Key, they would be able to perform actions in the Google Play Console on your behalf. The actions they could perform would be limited to the permissions granted to the service account key.

If the attacker has additionally gained access to your upload keystore, they would be able to submit a new version of an existing app. The actor would not be able to submit a new app to the Google Play Store in your name, as the first Google Play submission needs to be done through the web console.

#### Consequences if lost

None. If you lose the Google Service Account Key, you can revoke it using the Google Cloud Console and create a new one.

## iOS Push Notification credentials

There are two types of iOS push notification credentials: one modern approach recommended by Apple and the legacy approach. The default behavior is to use the modern approach, but developers may opt-in to the legacy approach by providing a p12 certificate.

### APNs auth key (p8) + key ID (string)

Each developer account has up to two auth keys, each of which can send notifications to any app on the account.

Auth keys are revocable from the Apple Developer Center. If you revoke them, notifications will stop working. If you provision a new auth key and upload it to Expo then notifications will resume working. Device tokens are not invalidated when auth keys are revoked.

### Consequences if compromised

If a malicious actor were to somehow gain access to the credentials, they would be able to send push notifications to your app. However, they would need to know which device tokens to send them to.

### Consequences if lost

The Apple Developer console lets you download an APNs Auth Key only when it is created. If an Auth Key is lost, it can be revoked through the Apple Developer console and replaced with a new key.

## iOS build credentials

This refers to the production distribution certificate and password (which are automatically generated if you let Expo manage them for you) and provisioning profiles (which are not secret). Like most credential data stored by Expo these are all encrypted with KMS. Your build credentials let you build an app to upload to App Store Connect. To actually upload it and submit it for review, though, you need to have your Apple Developer account credentials.

### Consequences if compromised

There isn't much that a malicious actor could do with this alone &mdash; they would be unable to submit any apps without having your Apple Developer account credentials. You can revoke the distribution certificate and provisioning profile from the Apple Developer website.

### Consequences if lost

None. They are available through the Apple Developer console.

## Apple Developer account credentials

When creating a standalone app build, or uploading to the App Store you will be prompted for your Apple Developer account credentials. We do not store these on our servers &mdash; EAS CLI only uses them locally. Your computer alone provisions distribution certificates and auth keys that are sent to Expo servers; your developer credentials are not sent to Expo servers. An additional layer of security is enforced by Apple, as they require two-factor authentication for all Apple Developer accounts.

When creating ad-hoc builds, we temporarily store an Apple Developer session token used to create an ad-hoc provisioning profile with your development device's UDID. Once we are done using this session token we destroy it.

### Keychain

By default, your Apple ID credentials are stored in the macOS Keychain.
Your password is only ever stored locally on your computer. This feature is not available for Windows or Linux users.

Disable Keychain support with the environment variable `EXPO_NO_KEYCHAIN=1`. You can also use this to change the saved password.

### Changing Apple ID password in Keychain

To delete the locally stored password, open the "Keychain Access" app, switch to "All Items", and search for "deliver. [Your Apple ID]" (example: `deliver.bacon@expo.dev`). Select the item you wish to modify and delete it. Next time running an Expo command you'll be prompted for a new password.

### Consequences if compromised

For standalone builds, as explained above, your machine would need to be compromised for a malicious actor to have access to your username and password. They would also need to have access to your two-factor authentication code generator, which for Apple Developer accounts is a pre-authorized Apple device. At this point, you may have worse problems, but as you may expect, the actor would be able to do whatever they like with your Apple Developer account.

For ad-hoc builds, if a user were to gain access to your session token it would be comparable to being signed in to your account.

### Consequences if lost

None. They are available through the Apple Developer console.

## iOS submit credentials

### Apple App Store Connect (ASC) API key

Apple App Store Connect (ASC) API key is one of the authentication methods that can be used to submit an iOS app to Apple's App Store using the EAS Submit service. This key is stored on the Expo servers and encrypted using [KMS](https://cloud.google.com/security/products/security-key-management) when at rest. The key will remain on Expo servers to be re-used for subsequent submissions, and it can be removed at any time by a user with the requisite permissions.

The ASC API key is the default and **recommended** authentication method for submitting your apps to the App Store using EAS Submit.

#### Consequences if compromised

If a malicious actor somehow gains access to the ASC API key, they would be able to perform actions in the App Store Connect on your behalf. The actions they could perform would be limited to the permissions granted to the API key.

If the attacker has additionally gained access to your build credentials, they would be able to submit a new version of an existing app. They would only be able to submit the app signed with those build credentials, and they can't submit any arbitrary app to the App Store in your name.

#### Consequences if lost

None. If you lose the ASC API key, you can revoke it using the App Store Connect portal and create a new one.

### Apple app-specific password

Apple app-specific password is another authentication method that can be used to submit an iOS app to Apple's App Store using the EAS Submit. Unlike other credentials, the app-specific password is not stored in the Expo servers between submissions, it must be provided each time it is to be used.

The password is encrypted using [KMS](https://cloud.google.com/security/products/security-key-management) and stored only for the period required to submit the app to the App Store plus 24 hours, to allow for retries during that time. Once this period is over, the password is deleted from the Expo servers.

This authentication method is **not recommended**. We recommend using the Apple Store Connect (ASC) API key for submitting your apps to the App Store instead. Expo won't use the Apple app-specific password in any way other than to submit your app to the App Store.

#### Consequences if compromised

If a malicious actor somehow gains access to the app-specific password, they would be able to access information like mail, contacts, and calendars that you store in iCloud (check [Apple's documentation](https://support.apple.com/en-us/102654) for more details).

If the attacker has additionally gained access to your build credentials, they would be able to submit a new version of an existing app. They would only be able to submit the app signed with those build credentials, and they can't submit any arbitrary app to the App Store in your name.

#### Consequences if lost

None. If you lose the app-specific password, you can revoke it and create a new one in the Apple account settings.

## Device tokens for Android and iOS push notifications

On top of the platform-specific credentials, a device token is necessary to send a push notification. Expo manages this for you and provides an abstraction on top of it with the Expo Push Token. The device token identifies the recipient, that is, the device to whom the notification is being sent. The device tokens are encrypted at rest and periodically cycled automatically by Android and iOS.

### Consequences if compromised

If a malicious actor has access to the device tokens, they will be unable to do anything with them unless they also have the push notification credentials for the appropriate platform.

### Consequences if lost

You won't be able to send notifications to users until they open your app again.

## Need more control?

If the above information doesn't satisfy your security requirements, you may wish to run your standalone app builds [on your infrastructure](/build-reference/local-builds/). Note that you will still need to provide your push notification credentials to use the push notification service. If that is also impossible, we recommend handling push notifications on your own.
