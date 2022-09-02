---
title: AppleAuthentication
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-apple-authentication'
packageName: 'expo-apple-authentication'
---

import { ConfigReactNative, ConfigPluginExample } from '~/components/plugins/ConfigSection';
import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-apple-authentication`** provides Apple authentication for iOS 13+. It does not yet support lower iOS versions, Android, or web.

Beginning with iOS 13, any app that includes third-party authentication options **must** provide Apple authentication as an option in order to comply with App Store Review guidelines. Learn more about Apple authentication on the ["Sign In with Apple" website](https://developer.apple.com/sign-in-with-apple/).

<PlatformsSection ios simulator />

## Installation

<APIInstallSection />

## Configuration in app.json / app.config.js

You can configure `expo-apple-authentication` using its built-in [config plugin](/guides/config-plugins) if you use config plugins in your project ([EAS Build](/build/introduction) or `npx expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect. If your app does **not** use EAS Build, then you'll need to manually configure the package.

<ConfigReactNative>

Apps that don't use [EAS Build](/build/introduction) must [manually configure](/build-reference/ios-capabilities#manual-setup) the **Apple Sign In** capability for their bundle identifier.

If you enable the **Apple Sign In** capability through the [Apple Developer Console](/build-reference/ios-capabilities#apple-developer-console), then be sure to add the following entitlements in your `ios/[app]/[app].entitlements` file:

```xml
<key>com.apple.developer.applesignin</key>
<array>
  <string>Default</string>
</array>
```

Also be sure to set `CFBundleAllowMixedLocalizations` to `true` in your `ios/[app]/Info.plist` to ensure the sign in button uses the device locale.

</ConfigReactNative>

<ConfigPluginExample>

> This plugin is included automatically when installed.

Running [EAS Build](/build/introduction) locally will use [iOS capabilities signing](/build-reference/ios-capabilities) to enable the required capabilities before building.

```json
{
  "expo": {
    "plugins": ["expo-apple-authentication"]
  }
}
```

</ConfigPluginExample>

## Usage

```js
import * as AppleAuthentication from 'expo-apple-authentication';

function YourComponent() {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={{ width: 200, height: 44 }}
      onPress={async () => {
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          // signed in
        } catch (e) {
          if (e.code === 'ERR_CANCELED') {
            // handle that the user canceled the sign-in flow
          } else {
            // handle other errors
          }
        }
      }}
    />
  );
}
```

## Development and Testing

You can test this library in development in Expo Go on iOS without following any of the instructions above; however, you'll need to do this setup in order to use Apple Authentication in your standalone app. When you sign into Expo Go, the identifiers and values you receive will likely be different than what you'll receive in standalone apps.

You can do limited testing of this library on the iOS simulator. However, not all methods will behave the same as on a device, so we highly recommend testing on a real device when possible while developing.

## Verifying the Response from Apple

Apple's response includes a signed JWT with information about the user. To ensure that the response came from Apple, you can cryptographically verify the signature with Apple's public key, which is published at https://appleid.apple.com/auth/keys. This process is not specific to Expo.

## API

```js
import * as AppleAuthentication from 'expo-apple-authentication';
```

<APISection packageName="expo-apple-authentication" apiName="AppleAuthentication" />

## Error Codes

| Code                                    | Description                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ERR_APPLE_AUTHENTICATION_CREDENTIAL     | The request to get credential state failed. See the error message for additional specific information. |
| ERR_APPLE_AUTHENTICATION_INVALID_SCOPE  | An invalid [`AppleAuthenticationScope`](#appleauthenticationappleauthenticationscope) was passed in.   |
| ERR_APPLE_AUTHENTICATION_REQUEST_FAILED | The authentication request failed. See the error message for additional specific information.          |
| ERR_APPLE_AUTHENTICATION_UNAVAILABLE    | Apple authentication is unavailable on the device.                                                     |
| ERR_CANCELED                            | The user canceled the sign-in request from the system modal.                                           |
