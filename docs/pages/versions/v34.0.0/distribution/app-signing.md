---
title: App signing
---

Expo automates the process of signing your app for iOS and Android, but in both cases you can choose to provide your own overrides. Both `expo build:ios` and
`expo build:android` commands generate signed applications ready to be uploaded into respective stores.

On this page, we'll talk about the credentials that each platform requires. If you're curious about how we store your credentials on our end, take a look at our [security documentation](../security/).

## iOS

The 3 primary iOS credentials, all of which are associated with your Apple Developer account, are:

- Distribution Certificate
- Provisioning Profiles
- Push Notification Keys

Whether you let Expo handle all your credentials, or you handle them all yourself, it can be valuable to understand what each of these credentials mean, when and where they're used, and what happens when they expire or are revoked.

### Distribution Certificate

The distribution certificate is all about you, the developer, and not about any particular app. You may only have one distribution certificate associated with your Apple Developer account.
This certificate will be used for all of your apps. If this certificate expires, your apps in production will not be affected. However, you will need to generate a new certificate if you want to upload new apps to the App Store, or update any of your existing apps. Deleting a distribution certificate has no effect on any apps already on the App Store.

### Push Notification Keys

Apple Push Notification Keys (often abbreviated as APN keys) allow the associated apps to send and receive push notifications. By default, any app built with Expo will require an APN key. This is so that you can enable push notifications for your app through a quick [OTA update](../../guides/configuring-ota-updates/), rather than needing to submit an entirely new binary.

You can have a maximum of 2 APN keys associated with your Apple Developer account, and a single key can be used with any number of apps. If you revoke an APN key, all apps that rely on that key will no longer be able to send or receive push notifications until you upload a new key to replace it. Uploading a new APN key **will not** change your users' [Expo Push Tokens](../../sdk/notifications/#notificationsgetexpopushtokenasync). Push notification keys do not expire.

### Provisioning Profiles

Each profile is app-specific, meaning you will have a provisioning profile for every app you submit to the App Store. These provisioning profiles are associated with your distribution certificate, so if that is revoked or expired, you'll need to regenerate the app's provisioning profile, as well. Similar to the distribution certificate, revoking your app's provisioning profile will not have any effect on apps already on the App Store.

Provisioning profiles expire after 12 months, but this won't affect apps in production. You will just need to create a new one the next time you build your app by running `expo build:ios --clear-provisioning-profile`.

### Summary

| Credential               | Limit Per Account | App-specific? | Can be revoked with no production side effects? | Used at... |
| ------------------------ | ----------------- | ------------- | ----------------------------------------------- | ---------- |
| Distribution Certificate | 1                 | ❌            | ✅                                              | Build time |
| Push Notification Key    | 2                 | ❌            | ❌                                              | Run time   |
| Provisioning Profile     | Unlimited         | ✅            | ✅                                              | Build time |

### Clearing Credentials

When you use the `expo credentials:manager` or `expo build:ios --clear-credentials` commands to delete your credentials, this only removes those credentials from Expo's servers, **it does not delete the credentials from Apple's perspective**. This means that to fully delete your credentials (let's say, because you want a new push notification key but you already have 2), you'll need to do so from the [Apple Developer Console](https://developer.apple.com/account/resources/certificates/list).

## Android

#### How it works

Google requires all Android apps to be digitally signed with a certificate before they are installed on a device or updated. Usually
a private key and its public certificate are stored in a keystore. In the past, APKs uploaded to the store were required to be signed with
the **app signing certificate** (certificate that will be attached to the app in store), and if the keystore was lost there was no way to
recover or reset it. If you opt in to App Signing by Google Play you need to upload an APK signed with an **upload certificate**, and Google Play will
strip that signature and replace it with one generated using the **app signing certificate**. Both the upload keystore and keystore with
the **app signing key** are essentially the same mechanism, but if your upload keystore is lost or compromised, you can contact
the Google Play support team to reset the key.

From the build process's perspective, there is no difference whether an app is signed with an **upload certificate** or an **app signing certificate**. Either way, `expo build:android` will generate an APK signed with the keystore currently assigned to your application. If you want to generate an upload keystore manually, you can do
that the same way you created your original keystore.

See [here](https://developer.android.com/studio/publish/app-signing) to find more information about this process.

### 1. Using App Signing by Google Play (recommended)

Create a new application and allow Google Play to handle your **app signing key**. The certificate used to sign the first APK uploaded to the store
will be your **upload certificate** and each new release needs to be signed with it.

If you want to use Google Play App Signing in an existing app, run `expo opt-in-google-play-signing` and follow its instructions. After
this process, the original keystore will be backed up to your current working directory and credentials for that keystore will be printed on the screen,
Remove that keystore only when you are sure that everything works correctly.

In case you lose your upload keystore (or it's compromised), you can ask Google Support Team to reset your upload key.

- If you want Expo to handle creating the upload certificate:

  - `expo build:android --clear-credentials` and select the option `Let Expo handle the process!`, which generates a new keystore and signs a new APK with it
  - `expo fetch:android:upload-cert` extracts public certificate from the keystore into `.pem` file
  - Add the upload certificate to the Google Play console. Select `Export and upload a key (not using a Java keystore)` and a dropdown will appear for `(Optional) Create a new upload key for increased security (recommended)`. Steps 1 & 2 were already completed, so move to step 3

- If you want to handle it create the upload certificate yourself:
  - Generate a new keystore
  - Extract the upload certificate with
    ```sh
    keytool -export -rfc
      -keystore your-upload-keystore.jks
      -alias upload-alias
      -file output_upload_certificate.pem
    ```
  - Add the upload certificate to the Google Play console

### 2. Signing APKs with an **app signing key** (deprecated)

The first time you run `expo build:android`, you can choose for Expo to generate a keystore or manually specify all of the required credentials. These credentials are used to sign APKs created by Expo services.
