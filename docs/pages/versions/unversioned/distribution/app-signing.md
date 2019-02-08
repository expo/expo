---
title: App signing
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Process is automated for iOS and Android, but in both cases you can choose to provide your own overrides. Both `expo build:ios` and
`expo build:android` commands generate signed applications ready to be uploaded into respective stores.

## Android 

#### How it works

Google requires all Android apps to be digitally signed with a certificate before they are installed on a device or updated. Usually
a private key and its public certificate is stored in a keystore. In the past, APKs uploaded to the store were required to be signed with
the **app signing certificate** (certificate that will be attached to the app in store), if the keystore was lost there is no way to
recover or reset it. If you opt in to App Signing by Google Play you need to upload an APK signed with **upload certificate**, store will
strip that signature and replace it with one generated using **app signing certificate**. Both upload keystore and keystore with
**app signing key** are essentially the same mechanism, but if your upload keystore is lost or compromised, you can contact
the Google Play support team to reset the key.

From build process perspective, there is no difrence whether an app is signed with an **upload certificate** or an **app signing certificate**, `expo build:android` will generate an APK signed with the keystore currently assigned to your application. If you want to generate an upload keystore manually, you can do
that the same way you created your original keystore.

See [here](https://developer.android.com/studio/publish/app-signing to find more information about this process.


### 1. Using App Signing by Google Play (recomended)

Create a new application and allow Google Play to handle your **app signing key**. A certificate used to sign the first APK uploaded to the store
will be your **upload certificate** and each new release needs to be signed with it.

If you want to use App Signing in an already existing app, you can call `expo opt-in-google-play-signing` and follow its instructions. After
this process, the original keystore will be backed up to your current working directory and credentials for that keystore will be printed on the screen,
Remove that keystore only when you are sure that everything works correctly.

In case you lose your upload keystore (or it's compromised), you can ask Google Support Team to reset your upload key.
- If you want expo to handle it
  - `expo android:build --clear-credentials` and select option `Let Expo handle the process!`, this will generate a new keystore and sign new APK with it
  - `expo fetch:android:upload-cert` extracts public certificate from the keystore into `.pem` file
  - add the upload certificate in Google Play console

- If you want to handle it yourself
  - Generate a new keystore
  - Extract the upload certificate with
    ```bash
    keytool -export -rfc
      -keystore your-upload-keystore.jks
      -alias upload-alias
      -file output_upload_certificate.pem
    ```
  - Add the upload certificate in Google Play console

### 2. Signing APKs with **app signing key** (deprecated)

First time you call `expo build:android` you can allow expo to generate a keystore or pass it manually along with all necessary credentials,
generated APKs will signed.
