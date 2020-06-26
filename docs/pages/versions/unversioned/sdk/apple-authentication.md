---
title: AppleAuthentication
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-apple-authentication'
---

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
8. (Optional) If you'd like to localize the button text, you can add `"CFBundleAllowMixedLocalizations": true` to your `ios.infoPlist` property [in your app.json](https://docs.expo.io/workflow/configuration/#ios).

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

You can test this library in development in the iOS Expo client without following any of the instructions above; however, you'll need to do this setup in order to use Apple Authentication in your standalone app. When you sign into the Expo client, the identifiers and values you receive will likely be different than what you'll receive in standalone apps.

You can do limited testing of this library on the iOS simulator. However, not all methods will behave the same as on a device, so we highly recommend testing on a real device when possible while developing.

## Verifying the Response from Apple

Apple's response includes a signed JWT with information about the user. To ensure that the response came from Apple, you can cryptographically verify the signature with Apple's public key, which is published at https://appleid.apple.com/auth/keys. This process is not specific to Expo.

## API

```js
import * as AppleAuthentication from 'expo-apple-authentication';
```

**[Methods](#methods)**

- [`AppleAuthentication.isAvailableAsync()`](#appleauthenticationisavailableasync)
- [`AppleAuthentication.signInAsync(options)`](#appleauthenticationsigninasyncoptions)
- [`AppleAuthentication.getCredentialStateAsync(user)`](#appleauthenticationgetcredentialstateasyncuser)

**[Components](#components)**

- [`AppleAuthentication.AppleAuthenticationButton`](#appleauthenticationappleauthenticationbutton)

**[Prop Types](#appleauthenticationappleauthenticationbuttonprops)**

- [`AppleAuthentication.AppleAuthenticationButtonProps`](#appleauthenticationappleauthenticationbuttonprops)

**[Enum Types](#enum-types)**

- [`AppleAuthentication.AppleAuthenticationButtonStyle`](#appleauthenticationappleauthenticationbuttonstyle)
- [`AppleAuthentication.AppleAuthenticationButtonType`](#appleauthenticationappleauthenticationbuttontype)
- [`AppleAuthentication.AppleAuthenticationCredentialState`](#appleauthenticationappleauthenticationcredentialstate)
- [`AppleAuthentication.AppleAuthenticationScope`](#appleauthenticationappleauthenticationscope)
- [`AppleAuthentication.AppleAuthenticationUserDetectionStatus`](#appleauthenticationappleauthenticationuserdetectionstatus)

**[Object Types](#object-types)**

- [`AppleAuthentication.AppleAuthenticationCredential`](#appleauthenticationappleauthenticationcredential)
- [`AppleAuthentication.AppleAuthenticationFullName`](#appleauthenticationappleauthenticationfullname)
- [`AppleAuthentication.AppleAuthenticationSignInOptions`](#appleauthenticationappleauthenticationsigninoptions)

**[Error Codes](#error-codes)**

## Methods

### `AppleAuthentication.isAvailableAsync()`

Determine if the current device's operating system supports Apple authentication.

#### Returns

A promise that resolves to `true` if the system supports Apple authentication, and `false` otherwise.

### `AppleAuthentication.signInAsync(options)`

Sends a request to the operating system to initiate the Apple authentication flow, which will present a modal to the user over your app and allow them to sign in.

You can request access to the user's full name and email address in this method, which allows you to personalize your UI for signed in users. However, users can deny access to either or both of these options at runtime.

Additionally, you will only receive Apple Authentication Credentials the first time users sign into your app, so **you must store it for later use**. It's best to store this information either server-side, or using [SecureStore](../securestore/), so that the data persists across app installs. You can use [`AppleAuthenticationCredential.user`](#appleauthenticationappleauthenticationcredential) to identify the user, since this remains the same for apps released by the same developer.

#### Arguments

An optional [`AppleAuthenticationSignInOptions`](#appleauthenticationappleauthenticationsigninoptions) object with any of the following keys:

- **requestedScopes (_[AppleAuthenticationScope](#appleauthenticationappleauthenticationscope)[]_)** (optional) - Array of user information scopes to which your app is requesting access. Note that the user can choose to deny your app access to any scope at the time of logging in. You will still need to handle `null` values for any scopes you request. Additionally, note that the requested scopes will only be provided to you **the first time each user signs into your app**; in subsequent requests they will be `null`.
- **state (_string_)** (optional) - An arbitrary string that is returned unmodified in the corresponding credential after a successful authentication. This can be used to verify that the response was from the request you made and avoid replay attacks. More information on this property is available in the OAuth 2.0 protocol [RFC6749](https://tools.ietf.org/html/rfc6749#section-10.12).
- **nonce (_string_)** (optional) - An arbitrary string that is used to prevent replay attacks. See more information on this in the [OpenID Connect specification](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowSteps).

#### Returns

A promise that resolves to an [`AppleAuthenticationCredential`](#appleauthenticationappleauthenticationcredential) object after a successful authentication, and rejects with `ERR_CANCELED` if the user cancels the sign-in operation.

### `AppleAuthentication.getCredentialStateAsync(user)`

Queries the current state of a user credential, to determine if it is still valid or if it has been revoked.

> **Note**: This method must be tested on a real device. On the iOS simulator it always throws an error.

#### Arguments

- **user (_string_)** - The unique identifier for the user whose credential state you'd like to check. This should come from the `user` field of an [`AppleAuthenticationCredential`](#appleauthenticationappleauthenticationcredential) object.

#### Returns

A promise that resolves to an [`AppleAuthenticationCredentialState`](#appleauthenticationappleauthenticationcredentialstate) value depending on the state of the credential.

## Components

### `AppleAuthentication.AppleAuthenticationButton`

This component displays the proprietary "Sign In with Apple" / "Continue with Apple" button on your screen. The App Store Guidelines require you to use this component to start the authentication process instead of a custom button. Limited customization of the button is available via the provided properties.

You should only attempt to render this if [`AppleAuthentication.isAvailableAsync()`](#appleauthenticationisavailableasync) resolves to `true`. This component will render nothing if it is not available and you will get a warning in development mode.

The properties of this component extend from `View`; however, you should not attempt to set `backgroundColor` or `borderRadius` with the `style` property. This will not work and is against the App Store Guidelines. Instead, you should use the `buttonStyle` property to choose one of the predefined color styles and the `cornerRadius` property to change the border radius of the button.

Make sure to attach height and width via the style props as without these styles, the button will not appear on the screen.

#### `AppleAuthentication.AppleAuthenticationButtonProps`

- **onPress (_function_)** - The method to call when the user presses the button. You should call [`AppleAuthentication.signInAsync`](#appleauthenticationsigninasyncoptions) in here.
- **buttonType (_[AppleAuthenticationButtonType](#appleauthenticationappleauthenticationbuttontype)_)** - The type of button text to display ("Sign In with Apple" vs. "Continue with Apple").
- **buttonStyle (_[AppleAuthenticationButtonStyle](#appleauthenticationappleauthenticationbuttonstyle)_)** - The Apple-defined color scheme to use to display the button.
- **cornerRadius (_number_)** - The border radius to use when rendering the button. This works similarly to `style.borderRadius` in other Views.

## Enum Types

### `AppleAuthentication.AppleAuthenticationButtonStyle`

An enum whose values control which pre-defined color scheme to use when rendering an [`AppleAuthenticationButton`](#appleauthenticationappleauthenticationbutton).

- **`AppleAuthenticationButtonStyle.WHITE`** - White button with black text
- **`AppleAuthenticationButtonStyle.WHITE_OUTLINE`** - White button with a black outline and black text
- **`AppleAuthenticationButtonStyle.BLACK`** - Black button with white text

### `AppleAuthentication.AppleAuthenticationButtonType`

An enum whose values control which pre-defined text to use when rendering an [`AppleAuthenticationButton`](#appleauthenticationappleauthenticationbutton).

- **`AppleAuthenticationButtonType.SIGN_IN`** - "Sign in with Apple"
- **`AppleAuthenticationButtonType.CONTINUE`** - "Continue with Apple"
- **`AppleAuthenticationButtonType.SIGN_UP`** - "Sign up with Apple" **(requires iOS 13.2 or higher)**

### `AppleAuthentication.AppleAuthenticationCredentialState`

An enum whose values specify state of the credential when checked with [`AppleAuthentication.getCredentialStateAsync()`](#appleauthenticationgetcredentialstateasyncuser).

- **`AppleAuthenticationCredentialState.REVOKED`**
- **`AppleAuthenticationCredentialState.AUTHORIZED`**
- **`AppleAuthenticationCredentialState.NOT_FOUND`**
- **`AppleAuthenticationCredentialState.TRANSFERRED`**

### `AppleAuthentication.AppleAuthenticationScope`

An enum whose values specify scopes you can request when calling [`AppleAuthentication.signInAsync()`](#appleauthenticationsigninasyncoptions).

- **`AppleAuthenticationScope.FULL_NAME`**
- **`AppleAuthenticationScope.EMAIL`**

### `AppleAuthentication.AppleAuthenticationUserDetectionStatus`

An enum whose values specify the system's best guess for how likely the current user is a real person.

- **`AppleAuthenticationUserDetectionStatus.UNSUPPORTED`** - The system does not support this determination and there is no data.
- **`AppleAuthenticationUserDetectionStatus.UNKNOWN`** - The system has not determined whether the user might be a real person.
- **`AppleAuthenticationUserDetectionStatus.LIKELY_REAL`** - The user appears to be a real person.

## Object Types

### `AppleAuthentication.AppleAuthenticationCredential`

The object type returned from a successful call to [`AppleAuthentication.signInAsync`](#appleauthenticationsigninasyncoptions) which contains all of the pertinent user and credential information.

- **user (_string_)** - An identifier associated with the authenticated user. You can use this to check if the user is still authenticated later. This is stable and can be shared across apps released under the same development team. The same user will have a different identifier for apps released by other developers.
- **fullName (_[AppleAuthenticationFullName](#appleauthenticationappleauthenticationfullname)_)** - The user's name. May be `null` or contain `null` values if you didn't request the `FULL_NAME` scope, if the user denied access, or if this is not the first time the user has signed into your app.
- **email (_string_)** - The user's email address. Might not be present if you didn't request the `EMAIL` scope. May also be null if this is not the first time the user has signed into your app. If the user chose to withhold their email address, this field will instead contain an obscured email address with an Apple domain.
- **realUserStatus (_[AppleAuthenticationUserDetectionStatus](#appleauthenticationappleauthenticationuserdetectionstatus)_)** - A value that indicates whether the user appears to the system to be a real person.
- **state (_string_)** - An arbitrary string that your app provided as `state` in the request that generated the credential. Used to verify that the response was from the request you made. Can be used to avoid replay attacks. If you did not provide `state` when making the sign-in request, this field will be `null`.
- **identityToken (_string_)** - A JSON Web Token (JWT) that securely communicates information about the user to your app.
- **authorizationCode (_string_)** - A short-lived session token used by your app for proof of authorization when interacting with the app's server counterpart. Unlike `user`, this is ephemeral and will change each session.

### `AppleAuthentication.AppleAuthenticationFullName`

An object representing the tokenized portions of the user's full name. Any of all of the fields may be null; only applicable fields that the user has allowed your app to access will be nonnull.

- **namePrefix (_string_)**
- **givenName (_string_)**
- **middleName (_string_)**
- **familyName (_string_)**
- **nameSuffix (_string_)**
- **nickname (_string_)**

### `AppleAuthentication.AppleAuthenticationSignInOptions`

The options you can supply when making a call to [`AppleAuthentication.signInAsync()`](#appleauthenticationsigninasyncoptions). None of these options are required.

- **requestedScopes (_[AppleAuthenticationScope](#appleauthenticationappleauthenticationscope)[]_)** - The scope of personal information to which your app is requesting access. The user can choose to deny your app access to any scope at the time of logging in. Defaults to `[]` (no scopes).
- **state (_string_)** - Data that's returned to you unmodified in the corresponding credential after a successful authentication. Used to verify that the response was from the request you made. Can be used to avoid replay attacks.

## Error Codes

| Code                                    | Description                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ERR_APPLE_AUTHENTICATION_CREDENTIAL     | The request to get credential state failed. See the error message for additional specific information. |
| ERR_APPLE_AUTHENTICATION_INVALID_SCOPE  | An invalid [`AppleAuthenticationScope`](#appleauthenticationappleauthenticationscope) was passed in.   |
| ERR_APPLE_AUTHENTICATION_REQUEST_FAILED | The authentication request failed. See the error message for additional specific information.          |
| ERR_APPLE_AUTHENTICATION_UNAVAILABLE    | Apple authentication is unavailable on the device.                                                     |
| ERR_CANCELED                            | The user canceled the sign-in request from the system modal.                                           |
