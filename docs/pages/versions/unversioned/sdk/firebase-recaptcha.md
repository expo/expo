---
title: Firebase reCAPTCHA
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-firebase-recaptcha'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-firebase-recaptcha`** provides a set of building blocks for creating a reCAPTCHA verifier and using that with your Firebase Phone authentication workflow.

> Firebase phone authentication is not possible out of the box using the Firebase JS SDK. This because an Application Verifier object (reCAPTCHA) is needed as an additional security measure to verify that the user is real and not a bot.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-firebase-recaptcha" />

## Basic usage

To get started[, read the offical Firebase phone-auth guide and **ignore all steps** that cover the reCAPTCHA configuration.](https://firebase.google.com/docs/auth/web/phone-auth)

Instead of using the standard `firebase.auth.RecaptchaVerifier` class, we will be using our own verifier which creates a reCAPTCHA widget inside a web-browser.

Add the `<FirebaseRecaptchaVerifierModal>` component to your screen and store its ref for later use. Also pass in the Firebase web configuration using the `firebaseConfig` prop.

```tsx
<FirebaseRecaptchaVerifierModal
  ref={ref => this.recaptchaVerifier = ref}
  firebaseConfig={firebase.app().options} />
```

Pass in the `recaptchaVerifier` ref to `verifyPhoneNumber`. This will automatically show the reCAPTCHA modal when calling `verifyPhoneNumber`.

```ts
const phoneProvider = new firebase.auth.PhoneAuthProvider();
const verificationId = await phoneProvider.verifyPhoneNumber(
  '+0123456789',
  this.recaptchaVerifier
);
```

You should now receive an SMS message on your phone. Create a text-input field and let the user enter the verification code.
The `verificationId` and the `verificationCode` can now be used to create a phone auth credential. Use that to sign in to firebase using `signInWithCredential`.

```ts
const credential = firebase.auth.PhoneAuthProvider.credential(
  verificationId,
  verificationCode
);
const authResult = await firebase.auth().signInWithCredential(credential);
```


## Example usage

```tsx
import * as React from 'react';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import {
  FirebaseRecaptchaVerifierModal,
  IFirebaseAuthApplicationVerifier
} from 'expo-firebase-recaptcha';

export default class PhoneAuthScreen extends React.Component {
  state: {
    phoneNumber: '',
    verificationId: '',
    verificationCode: ''
  };

  // Store a reference to the ReCAPTCHA verifier model.
  // The FirebaseRecaptchaVerifierModal class conforms to the
  // IFirebaseAuthApplicationVerifier interface so we can use it
  // directly with `verifyPhoneNumber`.
  recaptchaVerifier: IFirebaseAuthApplicationVerifier;

  // Call verifyPhoneNumber with the `recaptchaVerifier` ref.
  // This will automatically make the modal visible and display
  // the reCAPTCHA widget to the user.
  onPressSendVerificationCode = async () => {
    const { phoneNumber } = this.state;
    const phoneProvider = new firebase.auth.PhoneAuthProvider();
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      this.recaptchaVerifier
    );
    this.setState({ verificationId });
  };

  // Whenever the user has entered the verification-code, continue and
  // create the credential and sign in.
  onPressConfirmVerificationCode = async () => {
    const { verificationId, verificationCode } = this.state;
    const credential = firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      verificationCode
    );
    const authResult = await firebase.auth().signInWithCredential(credential);
  };

  render() {
    return (
      <FirebaseRecaptchaVerifierModal
        ref={ref => this.recaptchaVerifier = ref}
        firebaseConfig={firebase.app().options} />
      <TextInput
        autoFocus
        autoCompleteType="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeValue={phoneNumber => this.setState({ phoneNumber })} />
      <Button title='Send Verification Code' onPress={this.onPressSendVerificationCode} />
      <TextInput
        onChangeValue={verificationCode => this.setState({ verificationCode })} />
      <Button title='Confirm Verification Code' onPress={this.onPressConfirmVerificationCode} />
    );
  }
}
```

## Customizing the appearance

`<FirebaseRecaptchaVerifierModal>` has limited customisation options. You cannot change its appearance, but you can change the **title** and the **cancel-label**.

```tsx
<FirebaseRecaptchaVerifierModal
  ref={...}
  firebaseConfig={...}
  title='Prove you are human!'
  cancelLabel='Close'
/>
```

If you want a custom look & feel, then create your own `<Modal>` or display the `<FirebaseRecaptcha>` component inline in your screen.

```tsx
import { FirebaseRecaptchaVerifier } from 'expo-firebase-recaptcha';

class CustomPhoneAuthScreen extends React.Component {
  state = { 
    recaptchaToken: ''
  };

  onPressSendVerificationCode = async () => {

    // Create an application verifier from the reCAPTCHA token
    const { recaptchaToken } = this.state;
    if (!recaptchaToken) return;
    const applicationVerifier = new FirebaseRecaptchaVerifier(recaptchaToken);

    // Start phone autenthication
    const phoneProvider = new firebase.auth.PhoneAuthProvider();
    const verificationId = await phoneProvider.verifyPhoneNumber(
      '+0123456789',
      applicationVerifier
    );
  };

  render() {
    return (
      <FirebaseRecaptchaVerifier
        style={...}
        firebaseConfig={...}

        // Store the reCAPTCHA token when it has been verified
        onVerify={recaptchaToken => this.setState({
          recaptchaToken
        })} />
    );
  }
}
```

## API

```js
import {
  FirebaseRecaptcha,
  FirebaseRecaptchaVerifier,
  FirebaseRecaptchaVerifierModal,
  IFirebaseAuthApplicationVerifier
} from 'expo-firebase-recaptcha';
```

### `<FirebaseRecaptchaVerifierModal>`

Modal screen that is automatically shown and displays a reCAPTCHA widget. The ref to the component implements the `IFirebaseAuthApplicationVerifier` interface and can be used directly in the `verifyPhoneNumber` function.

#### Props

- **firebaseConfig (IFirebaseOptions)** -- Firebase web configuration.
- **firebaseVersion (string)** -- Optional version of the Firebase JavaScript SDK to load in the web-view. You can use this to load a custom or newer version. For example `version="6.8.0"`. 
- **title (string)** -- Title that is displayed on the top of the modal. The default is "reCAPTCHA".
- **cancelLabel (string)** -- Label of the cancel button.


### `<FirebaseRecaptcha>`

The reCAPTCHA v3 widget displayed inside a web-view.

#### Props

- **firebaseConfig (IFirebaseOptions)** -- Firebase web configuration.
- **firebaseVersion (string)** -- Optional version of the Firebase JavaScript SDK to load in the web-view. You can use this to load a custom or newer version. For example `version="6.8.0"`. 
- **onVerify (function)** -- A callback that is invoked when reCAPTCHA has verified that the user is not a bot. The callback is provided with the reCAPTCHA token string. Example `onVerify={(recaptchaToken: string) => this.setState({recaptchaToken})}`.


### `IFirebaseAuthApplicationVerifier`

Interface describing a domain verification and abuse prevention verifier.

```ts
interface IFirebaseAuthApplicationVerifier {
  readonly type: string; // Identifies the type of application verifier (e.g. "recaptcha").
  verify(): Promise<string>; // Returns a token that can be used to assert the validity of a request.
}
```


### `FirebaseRecaptchaVerifier`

A helper class implementing the `IFirebaseAuthApplicationVerifier` interface, which can be used when creating a customized reCAPTCHA workflow. The class takes a single `string` argument in the constructor which should be a valid reCAPTCHA token.

#### Example

```ts
const applicationVerifier = new FirebaseRecaptchaVerifier(recaptchaToken);

const phoneProvider = new firebase.auth.PhoneAuthProvider();
const verificationId = await phoneProvider.verifyPhoneNumber(
  '+0123456789',
  applicationVerifier
);
```
