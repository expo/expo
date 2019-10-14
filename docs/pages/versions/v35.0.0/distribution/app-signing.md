---
title: App signing
---

Process is automated for iOS and Android, but in both cases you can choose to provide your own overrides. Both `expo build:ios` and
`expo build:android` commands generate signed applications ready to be uploaded into respective stores.

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
  - add the upload certificate to the Google Play console

- If you want to handle it create the upload certificate yourself:
  - Generate a new keystore
  - Extract the upload certificate with
    ```bash
    keytool -export -rfc
      -keystore your-upload-keystore.jks
      -alias upload-alias
      -file output_upload_certificate.pem
    ```
  - Add the upload certificate to the Google Play console

### 2. Signing APKs with an **app signing key** (deprecated)

The first time you run `expo build:android`, you can choose for Expo to generate a keystore or manually specify all of the required credentials. These credentials are used to sign APKs created by Expo services.
generated APKs will signed.
