---
title: App signing
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Process is automated for iOS and Android, but in both cases you can choose to provide your own overrides. Both `build:ios` and
`build:android` generates signed applications ready to be uploaded into respective stores.

## Android 

#### How it works

Android requires that all APKs be digitally signed with a certificate before they are installed on a device or updated. Usually
a private key and its public certificate is stored in a keystore. In the past APKs uploaded to the store were requiered to be signed with
the **app signing certificate**(certificate that will be attached to app in store), if that keystore were lost there is no way to
recover or reset it. If you opt in to App Signing by Google Play you need to upload an apk signed with **upload certificate**, store will
strip that signature and replace it with one generated using **app signing certificate**. Both upload keystore and keystore with
**app signing key** are essentially the same mechanism, but if your upload keystore is lost or compromised you can contact
the Google Play support team to reset the key.

From build process perspective there is no difrence whether app is signed with **upload certificate** or **app signing certificate**, command `expo build:android` will generate apk signed using keystore currently assigned to application. If you want to genrate upload keystore manualy you can do
that the same way you created your original keystore.

You can find more informations about this proces [here](https://developer.android.com/studio/publish/app-signing).


### 1. Using App Signing by Google Play (recomended)

Create a new application and allow Google Play to handle your **app signing key**. Certificate used to sign first apk uploaded to the store
will be your **upload certificate** and each new release needs to be signed with it.

If you want to use App Signing in an already existing app, you can call `expo opt-in-google-play-signing` and follow it's instructions. After
this process original keystore will be backed up to your current working directory and credentials for that keystore will be printed on screen,
Remove that keystore only when you are sure that everything works.

In case you lose your upload keystore(or it's compromised), you can ask google support team to reset your upload key.
- If you want expo to handle it
  - `expo android:build --clear-credentials` and select option `Let Expo handle the process!`, this will generate a new keystore and sign new APK with it
  - `expo fetch:android:upload-cert` extracts public certificat from keystor into `.pem` file
  - add upload cert in Google Play console

- If you want to handle it yourself
  - Generate new keystore
  - Extract upload certificate with
    ```bash
    keytool -export -rfc
      -keystore your-upload-keystore.jks
      -alias upload-alias
      -file output_upload_certificate.pem
    ```
  - add upload certificate in Google Play console

### 2. Signing APKs with **app signing key** (deprecated)

First time you call `expo build:android` you can allow expo to generate keystore or pass it manually along with all necessary credentials,
generated APKs will signed.
