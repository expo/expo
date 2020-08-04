---
title: FirebaseRecaptcha
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-firebase-recaptcha'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-firebase-recaptcha`** provides a set of building blocks for creating a reCAPTCHA verifier and using that with your Firebase Phone authentication workflow.

> Firebase phone authentication is not possible out of the box using the Firebase JS SDK. This because an Application Verifier object (reCAPTCHA) is needed as an additional security measure to verify that the user is real and not a bot.

<PlatformsSection android emulator ios simulator />

> On web, you can use the [browser based reCAPTCHA verifier](https://firebase.google.com/docs/auth/web/phone-auth#set-up-the-recaptcha-verifier).

## Installation

<InstallSection packageName="expo-firebase-recaptcha" />

Additionally, you'll also need to install the webview using `expo install react-native-webview`

## Basic usage

To get started, [read the offical Firebase phone-auth guide and **ignore all steps** that cover the reCAPTCHA configuration.](https://firebase.google.com/docs/auth/web/phone-auth)

Instead of using the standard `firebase.auth.RecaptchaVerifier` class, we will be using our own verifier which creates a reCAPTCHA widget inside a web-browser.

Add the `<FirebaseRecaptchaVerifierModal>` component to your screen and store its ref for later use. Also pass in the Firebase web configuration using the `firebaseConfig` prop.

```tsx
<FirebaseRecaptchaVerifierModal
  ref={/* store ref for later use */}
  firebaseConfig={/* firebase web config */} />
```

Pass in the `recaptchaVerifier` ref to `verifyPhoneNumber`. This will automatically show the reCAPTCHA modal when calling `verifyPhoneNumber`.

```js
const phoneProvider = new firebase.auth.PhoneAuthProvider();
const verificationId = await phoneProvider.verifyPhoneNumber(
  '+0123456789',
  recaptchaVerifierRef
);
```

You should now receive an SMS message on your phone. Create a text-input field and let the user enter the verification code.
The `verificationId` and the `verificationCode` can now be used to create a phone auth credential. Use that to sign in to firebase using `signInWithCredential`.

```js
const credential = firebase.auth.PhoneAuthProvider.credential(
  verificationId,
  verificationCode
);
const authResult = await firebase.auth().signInWithCredential(credential);
```


## Example usage

<SnackInline label='Firebase Phone Auth' dependencies={['expo-firebase-recaptcha', 'firebase', 'react-native-webview']}>

```js
import * as React from "react";
import { Text, View, TextInput, Button, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import * as firebase from "firebase";

// Initialize Firebase JS SDK
// https://firebase.google.com/docs/web/setup
/*try {
  firebase.initializeApp({
    ...
  });
} catch (err) {
  // ignore app already initialized error in snack
}*/

export default function App() {
  const recaptchaVerifier = React.useRef(null);
  const [phoneNumber, setPhoneNumber] = React.useState();
  const [verificationId, setVerificationId] = React.useState();
  const [verificationCode, setVerificationCode] = React.useState();
  const firebaseConfig = firebase.apps.length ? firebase.app().options : undefined;
  const [message, showMessage] = React.useState((!firebaseConfig || Platform.OS === 'web')
    ? { text: "To get started, provide a valid firebase config in App.js and open this snack on an iOS or Android device."}
    : undefined);

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
      <Text style={{ marginTop: 20 }}>Enter phone number</Text>
      <TextInput
        style={{ marginVertical: 10, fontSize: 17 }}
        placeholder="+1 999 999 9999"
        autoFocus
        autoCompleteType="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={(phoneNumber) => setPhoneNumber(phoneNumber)}
      />
      <Button
        title="Send Verification Code"
        disabled={!phoneNumber}
        onPress={async () => {
          // The FirebaseRecaptchaVerifierModal ref implements the
          // FirebaseAuthApplicationVerifier interface and can be
          // passed directly to `verifyPhoneNumber`.
          try {
            const phoneProvider = new firebase.auth.PhoneAuthProvider();
            const verificationId = await phoneProvider.verifyPhoneNumber(
              phoneNumber,
              recaptchaVerifier.current
            );
            setVerificationId(verificationId);
            showMessage({
              text: "Verification code has been sent to your phone.",
            });
          } catch (err) {
            showMessage({ text: `Error: ${err.message}`, color: "red" });
          }
        }}
      />
      <Text style={{ marginTop: 20 }}>Enter Verification code</Text>
      <TextInput
        style={{ marginVertical: 10, fontSize: 17 }}
        editable={!!verificationId}
        placeholder="123456"
        onChangeText={setVerificationCode}
      />
      <Button
        title="Confirm Verification Code"
        disabled={!verificationId}
        onPress={async () => {
          try {
            const credential = firebase.auth.PhoneAuthProvider.credential(
              verificationId,
              verificationCode
            );
            await firebase.auth().signInWithCredential(credential);
            showMessage({ text: "Phone authentication successful 👍" });
          } catch (err) {
            showMessage({ text: `Error: ${err.message}`, color: "red" });
          }
        }}
      />
      {message ? (
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: 0xffffffee, justifyContent: "center" }]}
          onPress={() => showMessage(undefined)}>
          <Text style={{color: message.color || "blue", fontSize: 17, textAlign: "center", margin: 20, }}>
            {message.text}
          </Text>
        </TouchableOpacity>
      ) : undefined}
    </View>
  );
}

```

</SnackInline>


Or view the [Full Phone Authentication test snack](https://snack.expo.io/@ijzerenhein/firebase-phone-full-auth-demo).

## Customizing the appearance

`<FirebaseRecaptchaVerifierModal>` has limited customisation options. You cannot change its appearance, but you can change the **title** and the **cancel-label**.

```js
<FirebaseRecaptchaVerifierModal
  ref={...}
  firebaseConfig={...}
  title='Prove you are human!'
  cancelLabel='Close'
/>
```

If you want a custom look & feel, then create your own `<Modal>` or display the `<FirebaseRecaptcha>` component inline in your screen. Make sure to reserve enough space for the widget as it can not only display the compact "I'm not a robot" UI but also the **full verification UI requiring users to select images**.

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
  FirebaseAuthApplicationVerifier
} from 'expo-firebase-recaptcha';
```

### `<FirebaseRecaptchaVerifierModal>`

Modal screen that is automatically shown and displays a reCAPTCHA widget. The ref to the component implements the `FirebaseAuthApplicationVerifier` interface and can be used directly in the `verifyPhoneNumber` function.

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
- **onLoad (function)** -- A callback that is invoked when the widget has been loaded.
- **onError (function)** -- A callback that is invoked when the widget failed to load.
- **onVerify (function)** -- A callback that is invoked when reCAPTCHA has verified that the user is not a bot. The callback is provided with the reCAPTCHA token string. Example `onVerify={(recaptchaToken: string) => this.setState({recaptchaToken})}`.


### `FirebaseAuthApplicationVerifier`

Interface describing a domain verification and abuse prevention verifier.

```ts
interface FirebaseAuthApplicationVerifier {
  readonly type: string; // Identifies the type of application verifier (e.g. "recaptcha").
  verify(): Promise<string>; // Returns a token that can be used to assert the validity of a request.
}
```


### `FirebaseRecaptchaVerifier`

A helper class implementing the `FirebaseAuthApplicationVerifier` interface, which can be used when creating a customized reCAPTCHA workflow. The class takes a single `string` argument in the constructor which should be a valid reCAPTCHA token.

#### Example

```js
const applicationVerifier = new FirebaseRecaptchaVerifier(recaptchaToken);

const phoneProvider = new firebase.auth.PhoneAuthProvider();
const verificationId = await phoneProvider.verifyPhoneNumber(
  '+0123456789',
  applicationVerifier
);
```
