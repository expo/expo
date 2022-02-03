---
title: AppleAuthentication
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-42/packages/expo-apple-authentication'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-apple-authentication`** provides Apple authentication for iOS 13+. It does not yet support lower iOS versions, Android, or web.

Beginning with iOS 13, any app that includes third-party authentication options **must** provide Apple authentication as an option in order to comply with App Store Review guidelines. Learn more about Apple authentication on the ["Sign In with Apple" website](https://developer.apple.com/sign-in-with-apple/).

<PlatformsSection ios simulator />

## Installation

<InstallSection packageName="expo-apple-authentication" />

## Configuration

1. Enable the "Sign In with Apple" capability in your app. For bare projects, enable the capability in Xcode under "Signing & Capabilities" -- you'll need to be on Xcode 11 or later. For managed projects, set `ios.usesAppleSignIn` to `true` in app.json.
2. Log into the Apple Developer Console, go to "Certificates, Identifiers, & Profiles" and then "Identifiers".
3. You need to choose a primary app for the Apple Sign In configuration. This is the app whose icon will show up in the Apple Sign In system UI. If you have a set of related apps you might choose the "main" app as the primary, but most likely you'll want to just use the app you're working on now as the primary.
4. In the list of identifiers, click on the one corresponding to your primary app. Enable the "Sign In with Apple" capability, click "Edit", and choose the "Enable as a primary App ID" option. Save the new configuration.
5. If you chose a different app to be the primary, you'll also need to open up the configuration page for your current app, enable the "Sign In with Apple" capability, click "Edit" and choose the "Group with an existing primary App ID" option. Save this configuration as well.
6. Next, go to the "Keys" page and register a new key. Add the "Sign In with Apple" capability, and make sure to choose the correct primary app on the configuration screen.
7. Finally, when you want to make a standalone build to test with, run `expo build:ios --clear-provisioning-profile --revoke-credentials` so that your provisioning profile is regenerated with the new entitlement.
8. (Optional) If you'd like to localize the button text, you can add `"CFBundleAllowMixedLocalizations": true` to your `ios.infoPlist` property [in your app.json](/workflow/configuration/#ios). Note: The localized value will only appear in your standalone app.

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

## Components

### `AppleAuthentication.AppleAuthenticationButton`

This component displays the proprietary "Sign In with Apple" / "Continue with Apple" button on your screen. The App Store Guidelines require you to use this component to start the authentication process instead of a custom button. Limited customization of the button is available via the provided properties.

You should only attempt to render this if [`AppleAuthentication.isAvailableAsync()`](#appleauthenticationisavailableasync) resolves to `true`. This component will render nothing if it is not available and you will get a warning in development mode.

The properties of this component extend from `View`; however, you should not attempt to set `backgroundColor` or `borderRadius` with the `style` property. This will not work and is against the App Store Guidelines. Instead, you should use the `buttonStyle` property to choose one of the predefined color styles and the `cornerRadius` property to change the border radius of the button.

Make sure to attach height and width via the style props as without these styles, the button will not appear on the screen.

#### `AppleAuthentication.AppleAuthenticationButtonProps`

- **onPress (`function`)** - The method to call when the user presses the button. You should call [`AppleAuthentication.signInAsync`](#appleauthenticationsigninasyncoptions) in here.
- **buttonType (`[AppleAuthenticationButtonType](#appleauthenticationappleauthenticationbuttontype)`)** - The type of button text to display ("Sign In with Apple" vs. "Continue with Apple").
- **buttonStyle (`[AppleAuthenticationButtonStyle](#appleauthenticationappleauthenticationbuttonstyle)`)** - The Apple-defined color scheme to use to display the button.
- **cornerRadius (`number`)** - The border radius to use when rendering the button. This works similarly to `style.borderRadius` in other Views.

<APISection packageName="expo-apple-authentication" apiName="AppleAuthentication" />

## Error Codes

| Code                                    | Description                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ERR_APPLE_AUTHENTICATION_CREDENTIAL     | The request to get credential state failed. See the error message for additional specific information. |
| ERR_APPLE_AUTHENTICATION_INVALID_SCOPE  | An invalid [`AppleAuthenticationScope`](#appleauthenticationappleauthenticationscope) was passed in.   |
| ERR_APPLE_AUTHENTICATION_REQUEST_FAILED | The authentication request failed. See the error message for additional specific information.          |
| ERR_APPLE_AUTHENTICATION_UNAVAILABLE    | Apple authentication is unavailable on the device.                                                     |
| ERR_CANCELED                            | The user canceled the sign-in request from the system modal.                                           |
