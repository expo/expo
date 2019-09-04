---
title: AppleAuthentication
---

This library provides Apple authentication for iOS standalone apps in the managed and bare workflows. Beginning with iOS 13, any app that includes third-party authentication options **must** provide Apple authentication as an option in order to comply with App Store Review guidelines.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-apple-authentication`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-apple-authentication).

> **Note**: This module is not implemented on web.

## Setup

> **Note**: You can test this library in development in the iOS Expo client without following any of the instructions below; however, you'll need to do this setup in order to use Apple Authentication in your standalone app. When you test in the Expo client, you will be signing into Expo rather than your own app, and so the identifiers and values you receive will likely be different than what you'll receive in production.

1. Enable the "Sign In with Apple" capability in your app. For bare projects, enable the capability in Xcode under "Signing & Capabilities" -- you'll need to be on Xcode 11 or later. For managed projects, set `ios.usesAppleSignIn` to `true` in app.json.
2. Log into the Apple Developer Console, go to "Certificates, Identifiers, & Profiles" and then "Identifiers".
3. You need to choose a primary app for the Apple Sign In configuration. This is the app whose icon will show up in the Apple Sign In system UI. If you have a set of related apps you might choose the "main" app as the primary, but most likely you'll want to just use the app you're working on now as the primary.
4. In the list of identifiers, click on the one corresponding to your primary app. Enable the "Sign In with Apple" capability, click "Edit", and choose the "Enable as a primary App ID" option. Save the new configuration.
5. If you chose a different app to be the primary, you'll also need to open up the configuration page for your current app, enable the "Sign In with Apple" capability, click "Edit" and choose the "Group with an existing primary App ID" option. Save this configuration as well.
6. Finally, go to the "Keys" page and register a new key. Add the "Sign In with Apple" capability, and make sure to choose the correct primary app on the configuration screen.

## API

```ts
import * as AppleAuthentication from 'expo-apple-authentication';
```

### Methods

- [`AppleAuthentication.isAvailableAsync()`](#appleauthenticationisavailableasync)
- [`AppleAuthentication.signInAsync(options)`](#appleauthenticationsigninasyncoptions)
- [`AppleAuthentication.getCredentialStateAsync(user)`](#appleauthenticationgetcredentialstateasyncuser)

### Components

- [`AppleAuthentication.AppleAuthenticationButton`](#appleauthenticationappleauthenticationbutton)

### Prop Types

- [`AppleAuthentication.AppleAuthenticationButtonProps`](#appleauthenticationappleauthenticationbuttonprops)

### Enum Types

- [`AppleAuthentication.AppleAuthenticationButtonStyle`](#appleauthenticationappleauthenticationbuttonstyle)
- [`AppleAuthentication.AppleAuthenticationButtonType`](#appleauthenticationappleauthenticationbuttontype)
- [`AppleAuthentication.AppleAuthenticationCredentialState`](#appleauthenticationappleauthenticationcredentialstate)
- [`AppleAuthentication.AppleAuthenticationScope`](#appleauthenticationappleauthenticationscope)
- [`AppleAuthentication.AppleAuthenticationStatus`](#appleauthenticationappleauthenticationstatus)
- [`AppleAuthentication.AppleAuthenticationUserDetectionStatus`](#appleauthenticationappleauthenticationuserdetectionstatus)

### Object Types

- [`AppleAuthentication.AppleAuthenticationCredential`](#appleauthenticationappleauthenticationcredential)
- [`AppleAuthentication.AppleAuthenticationFullName`](#appleauthenticationappleauthenticationfullname)
- [`AppleAuthentication.AppleAuthenticationSignInOptions`](#appleauthenticationappleauthenticationsigninoptions)

### Errors

- [Error Codes](#error-codes)

## Methods

### `AppleAuthentication.isAvailableAsync()`

Determine if the current device's operating system supports Apple authentication.

#### Returns

A Promise that resolves to `true` if the system supports Apple authentication, and `false` otherwise.

### `AppleAuthentication.signInAsync(options)`

Sends a request to the operating system to initiate the Apple authentication flow, which will present a modal to the user over your app and allow them to sign in.

#### Arguments

An optional `AppleAuthenticationSignInOptions` object with any of the following keys:

- **requestedScopes (_AppleAuthenticationScope[]_)** - Array of user information scopes to which your app is requesting access. Note that the user can choose to deny your app access to any scope at the time of logging in. You will still need to handle null values for any scopes you request.
- **state (_string_)** - An arbitrary string that is returned unmodified in the corresponding credential after a successful authentication. This can be used to verify that the response was from the request you made and avoid replay attacks.

#### Returns

A Promise that resolves to an `AppleAuthenticationCredential` object after a successful authentication, and rejects with `ERR_CANCELED` if the user cancels the sign-in operation.

### `AppleAuthentication.getCredentialStateAsync(user)`

Query the current state of a user credential, to determine if it is still valid or if it has been revoked.

#### Arguments

- **user (_string_)** - The unique identifier for the user whose credential state you'd like to check. This should come from the `user` field of an `AppleAuthenticationCredential` object.

#### Returns

A Promise that resolves to an `AppleAuthenticationCredentialState` value depending on the state of the credential.

## Components

### `AppleAuthentication.AppleAuthenticationButton`

This component displays the proprietary "Sign In with Apple" / "Continue with Apple" button on your screen. The App Store Guidelines require you to use this component to start the authentication process instead of a custom button. Limited customization of the button is available via the provided properties.

You should only attempt to render this if `AppleAuthentication.isAvailableAsync()` resolves to `true`. This component will render nothing if it is not available and you will get a warning in development mode.

The properties of this component extend from `View`; however, you should not attempt to set `backgroundColor` or `borderRadius` with the `style` property. This will not work and is against the App Store Guidelines. Instead, you should use the `buttonStyle` property to choose one of the predefined color styles and the `cornerRadius` property to change the border radius of the button.

#### `AppleAuthentication.AppleAuthenticationButtonProps`

- **onPress (_function_)** - The method to call when the user presses the button. You should call `AppleAuthentication.signInAsync` in here.
- **buttonType (_AppleAuthenticationButtonType_)** - The type of button text to display ("Sign In with Apple" vs. "Continue with Apple").
- **buttonStyle (_AppleAuthenticationButtonStyle_)** - The Apple-defined color scheme to use to display the button.
- **cornerRadius (_number_)** - The border radius to use when rendering the button. This works similarly to `style.borderRadius` in other Views.

#### Example

// TODO(eric): add a somewhat fully-fledged example here

## Enum Types

### `AppleAuthentication.AppleAuthenticationButtonStyle`

An enum whose values control which pre-defined color scheme to use when rendering an `AppleAuthenticationButton`.

- **`AppleAuthenticationButtonStyle.WHITE`** - White button with black text
- **`AppleAuthenticationButtonStyle.WHITE_OUTLINE`** - White button with a black outline and black text
- **`AppleAuthenticationButtonStyle.BLACK`** - Black button with white text

### `AppleAuthentication.AppleAuthenticationButtonType`

An enum whose values control which pre-defined text to use when rendering an `AppleAuthenticationButton`.

- **`AppleAuthenticationButtonType.SIGN_IN`** - "Sign in with Apple"
- **`AppleAuthenticationButtonType.CONTINUE`** - "Continue with Apple"
- **`AppleAuthenticationButtonType.DEFAULT`** - Uses the system-determined default for button type

### `AppleAuthentication.AppleAuthenticationCredentialState`

An enum whose values specify state of the credential when checked with `AppleAuthentication.getCredentialStateAsync()`.

- **`AppleAuthenticationCredentialState.REVOKED`**
- **`AppleAuthenticationCredentialState.AUTHORIZED`**
- **`AppleAuthenticationCredentialState.NOT_FOUND`**
- **`AppleAuthenticationCredentialState.TRANSFERRED`**

### `AppleAuthentication.AppleAuthenticationScope`

An enum whose values specify scopes you can request when calling `AppleAuthentication.signInAsync()`.

- **`AppleAuthenticationScope.FULL_NAME`**
- **`AppleAuthenticationScope.EMAIL`**

### `AppleAuthentication.AppleAuthenticationUserDetectionStatus`

An enum whose values specify the system's best guess for how likely the current user is a real person.

- **`AppleAuthenticationUserDetectionStatus.UNSUPPORTED`** - The system does not support this determination and there is no data.
- **`AppleAuthenticationUserDetectionStatus.UNKNOWN`** - The system has not determined whether the user might be a real person.
- **`AppleAuthenticationUserDetectionStatus.LIKELY_REAL`** - The user appears to be a real person.

## Object Types

TODO(eric)

## Error Codes

TODO(eric)
