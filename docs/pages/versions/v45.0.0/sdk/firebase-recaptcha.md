---
title: FirebaseRecaptcha
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-firebase-recaptcha'
packageName: 'expo-firebase-recaptcha'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';

`expo-firebase-recaptcha` provides a set of building blocks for creating a reCAPTCHA verifier and using that with your Firebase Phone authentication workflow.

> Firebase phone authentication is not possible out of the box using the Firebase JS SDK. This because an Application Verifier object (reCAPTCHA) is needed as an additional security measure to verify that the user is real and not a bot.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

Additionally, you'll also need to install the webview using `expo install react-native-webview`.

## Usage

### With native Firebase SDK

If you are using [React Native Firebase](https://rnfirebase.io/) in your project, you should use [`@react-native-firebase/auth`](https://rnfirebase.io/auth/phone-auth) package provided by the library. For more information on how to configure the native Firebase, see [using the native Firebase SDK](/guides/setup-native-firebase/).

### Basic usage

To get started, [read the official Firebase phone-auth guide and **ignore all steps** that cover the reCAPTCHA configuration](https://firebase.google.com/docs/auth/web/phone-auth).

Instead of using the standard `firebase.auth.RecaptchaVerifier` class, we will be using our own verifier which creates a reCAPTCHA widget inside a web-browser.

Add the `<FirebaseRecaptchaVerifierModal>` component to your screen and store its ref for later use. Also pass in the Firebase web configuration using the `firebaseConfig` prop.

> 🚨 Optionally you can turn on **experimental invisible reCAPTCHA** using `attemptInvisibleVerification`. This feature is experimental and attempts to complete the verification process without showing any UI to the user. When invisible verification fails, the full reCATPCHA challenge UI is shown. The Google terms for invisible reCAPTCHA apply - use `<FirebaseRecaptchaBanner>` to show the Google terms when using invisible reCAPTCHA.

```tsx
<FirebaseRecaptchaVerifierModal
  ref={/* store ref for later use */}
  firebaseConfig={/* firebase web config */}
  attemptInvisibleVerification={true | false /* experimental */}
/>
```

Pass in the `recaptchaVerifier` ref to `verifyPhoneNumber`. This will automatically show the reCAPTCHA modal when calling `verifyPhoneNumber`.

```js
const phoneProvider = new firebase.auth.PhoneAuthProvider();
const verificationId = await phoneProvider.verifyPhoneNumber('+0123456789', recaptchaVerifierRef);
```

You should now receive an SMS message on your phone. Create a text-input field and let the user enter the verification code.
The `verificationId` and the `verificationCode` can now be used to create a phone auth credential. Use that to sign in to firebase using `signInWithCredential`.

```js
const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, verificationCode);
const authResult = await firebase.auth().signInWithCredential(credential);
```

### Phone authentication example

The examples below assumes that you are using `firebase@9.x.x` JS SDK.

<SnackInline
label='Firebase Phone Auth'
dependencies={['expo-firebase-recaptcha', 'firebase', 'react-native-webview']}>

```js
import * as React from 'react';
import {
  Text,
  View,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// Initialize Firebase JS SDK >=9.x.x
// https://firebase.google.com/docs/web/setup
/*try {
  initializeApp({
    ...
  });
} catch (err) {
  // ignore app already initialized error in snack
}*/

// Firebase references
const app = getApp();
const auth = getAuth();

// Double-check that we can run the example
if (!app?.options || Platform.OS === 'web') {
  throw new Error(
    'This example only works on Android or iOS, and requires a valid Firebase config.'
  );
}

export default function App() {
  // Ref or state management hooks
  const recaptchaVerifier = React.useRef(null);
  const [phoneNumber, setPhoneNumber] = React.useState();
  const [verificationId, setVerificationId] = React.useState();
  const [verificationCode, setVerificationCode] = React.useState();

  const firebaseConfig = app ? app.options : undefined;
  const [message, showMessage] = React.useState();
  const attemptInvisibleVerification = false;

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        // attemptInvisibleVerification
      />
      <Text style={{ marginTop: 20 }}>Enter phone number</Text>
      <TextInput
        style={{ marginVertical: 10, fontSize: 17 }}
        placeholder="+1 999 999 9999"
        autoFocus
        autoCompleteType="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={phoneNumber => setPhoneNumber(phoneNumber)}
      />
      <Button
        title="Send Verification Code"
        disabled={!phoneNumber}
        onPress={async () => {
          // The FirebaseRecaptchaVerifierModal ref implements the
          // FirebaseAuthApplicationVerifier interface and can be
          // passed directly to `verifyPhoneNumber`.
          try {
            const phoneProvider = new PhoneAuthProvider(auth);
            const verificationId = await phoneProvider.verifyPhoneNumber(
              phoneNumber,
              recaptchaVerifier.current
            );
            setVerificationId(verificationId);
            showMessage({
              text: 'Verification code has been sent to your phone.',
            });
          } catch (err) {
            showMessage({ text: `Error: ${err.message}`, color: 'red' });
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
            const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
            await signInWithCredential(auth, credential);
            showMessage({ text: 'Phone authentication successful 👍' });
          } catch (err) {
            showMessage({ text: `Error: ${err.message}`, color: 'red' });
          }
        }}
      />
      {message ? (
        <TouchableOpacity
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 0xffffffee, justifyContent: 'center' },
          ]}
          onPress={() => showMessage(undefined)}>
          <Text
            style={{
              color: message.color || 'blue',
              fontSize: 17,
              textAlign: 'center',
              margin: 20,
            }}>
            {message.text}
          </Text>
        </TouchableOpacity>
      ) : undefined}
      {attemptInvisibleVerification && <FirebaseRecaptchaBanner />}
    </View>
  );
}
```

</SnackInline>

<SnackInline
contentHidden
buttonTitle='Try the Full Phone Authentication on Snack'
label='Firebase Full Phone Auth'
dependencies={['expo-firebase-recaptcha', 'firebase', 'react-native-webview']}>

```tsx
import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as FirebaseRecaptcha from 'expo-firebase-recaptcha';
import { initializeApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// PROVIDE VALID FIREBASE >=9.x.x CONFIG HERE
// https://firebase.google.com/docs/web/setup
const FIREBASE_CONFIG: any = {
  /*apiKey: "api-key",
  authDomain: "project-id.firebaseapp.com",
  databaseURL: "https://project-id.firebaseio.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "sender-id",
  appId: "app-id",
  measurementId: "G-measurement-id",*/
};

try {
  if (FIREBASE_CONFIG.apiKey) {
    initializeApp(FIREBASE_CONFIG);
  }
} catch (err) {
  // ignore app already initialized error on snack
}

// Firebase references
const auth = getAuth();

export default function PhoneAuthScreen() {
  const recaptchaVerifier = React.useRef(null);
  const verificationCodeTextInput = React.useRef(null);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [verificationId, setVerificationId] = React.useState('');
  const [verifyError, setVerifyError] = React.useState();
  const [verifyInProgress, setVerifyInProgress] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmError, setConfirmError] = React.useState();
  const [confirmInProgress, setConfirmInProgress] = React.useState(false);
  const isConfigValid = !!FIREBASE_CONFIG.apiKey;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FirebaseRecaptcha.FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={FIREBASE_CONFIG}
        />
        <Text style={styles.title}>Firebase Phone Auth</Text>
        <Text style={styles.subtitle}>using expo-firebase-recaptcha</Text>
        <Text style={styles.text}>Enter phone number</Text>
        <TextInput
          style={styles.textInput}
          autoFocus={isConfigValid}
          autoCompleteType="tel"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          placeholder="+1 999 999 9999"
          editable={!verificationId}
          onChangeText={(phoneNumber: string) => setPhoneNumber(phoneNumber)}
        />
        <Button
          title={`${verificationId ? 'Resend' : 'Send'} Verification Code`}
          disabled={!phoneNumber}
          onPress={async () => {
            const phoneProvider = new PhoneAuthProvider(auth);
            try {
              setVerifyError(undefined);
              setVerifyInProgress(true);
              setVerificationId('');
              const verificationId = await phoneProvider.verifyPhoneNumber(
                phoneNumber,
                // @ts-ignore
                recaptchaVerifier.current
              );
              setVerifyInProgress(false);
              setVerificationId(verificationId);
              verificationCodeTextInput.current?.focus();
            } catch (err) {
              setVerifyError(err);
              setVerifyInProgress(false);
            }
          }}
        />
        {verifyError && <Text style={styles.error}>{`Error: ${verifyError.message}`}</Text>}
        {verifyInProgress && <ActivityIndicator style={styles.loader} />}
        {verificationId ? (
          <Text style={styles.success}>A verification code has been sent to your phone</Text>
        ) : undefined}
        <Text style={styles.text}>Enter verification code</Text>
        <TextInput
          ref={verificationCodeTextInput}
          style={styles.textInput}
          editable={!!verificationId}
          placeholder="123456"
          onChangeText={(verificationCode: string) => setVerificationCode(verificationCode)}
        />
        <Button
          title="Confirm Verification Code"
          disabled={!verificationCode}
          onPress={async () => {
            try {
              setConfirmError(undefined);
              setConfirmInProgress(true);
              const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
              const authResult = await signInWithCredential(auth, credential);
              setConfirmInProgress(false);
              setVerificationId('');
              setVerificationCode('');
              verificationCodeTextInput.current?.clear();
              Alert.alert('Phone authentication successful!');
            } catch (err) {
              setConfirmError(err);
              setConfirmInProgress(false);
            }
          }}
        />
        {confirmError && <Text style={styles.error}>{`Error: ${confirmError.message}`}</Text>}
        {confirmInProgress && <ActivityIndicator style={styles.loader} />}
      </View>
      {!isConfigValid && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>
            To get started, set a valid FIREBASE_CONFIG in App.tsx.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    marginTop: 50,
  },
  title: {
    marginBottom: 2,
    fontSize: 29,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 10,
    opacity: 0.35,
    fontWeight: 'bold',
  },
  text: {
    marginTop: 30,
    marginBottom: 4,
  },
  textInput: {
    marginBottom: 8,
    fontSize: 17,
    fontWeight: 'bold',
  },
  error: {
    marginTop: 10,
    fontWeight: 'bold',
    color: 'red',
  },
  success: {
    marginTop: 10,
    fontWeight: 'bold',
    color: 'blue',
  },
  loader: {
    marginTop: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFFC0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontWeight: 'bold',
  },
});
```

</SnackInline>

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
import { FirebaseRecaptcha, FirebaseRecaptchaVerifier } from 'expo-firebase-recaptcha';

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
    const phoneProvider = new PhoneAuthProvider();
    const verificationId = await phoneProvider.verifyPhoneNumber(
      '+0123456789',
      applicationVerifier
    );
  };

  render() {
    return (
      <FirebaseRecaptcha
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
  FirebaseRecaptchaBanner,
  FirebaseRecaptchaVerifier,
  FirebaseRecaptchaVerifierModal,
  FirebaseAuthApplicationVerifier,
} from 'expo-firebase-recaptcha';
```

### `<FirebaseRecaptchaVerifierModal>`

Modal screen that is automatically shown and displays a reCAPTCHA widget. The ref to the component implements the `FirebaseAuthApplicationVerifier` interface and can be used directly in the `verifyPhoneNumber` function.

#### Props

- **firebaseConfig (IFirebaseOptions)** -- Firebase web configuration.
- **firebaseVersion (string)** -- Optional version of the Firebase JavaScript SDK to load in the web-view. You can use this to load a custom or newer version. For example `version="7.9.0"`.
- **attemptInvisibleVerification (boolean)** -- Attempts to verify without showing the reCAPTCHA workflow. The default is `false`. (Google terms apply - use `FirebaseRecaptchaBanner` to show te Google terms & policy).
- **appVerificationDisabledForTesting (boolean)** -- When set, disables app verification for the purpose of testing phone authentication. When this prop is `true`, a mock reCAPTCHA is rendered. This is useful for manual testing during development or for automated integration tests. See [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth#integration-testing) for more info.
- **languageCode (string)** -- Language to display the reCAPTCHA challenge in. For a list of possible languages, see [reCAPTCHA Language Codes](https://developers.google.com/recaptcha/docs/language).
- **title (string)** -- Title that is displayed on the top of the modal. The default is "reCAPTCHA".
- **cancelLabel (string)** -- Label of the cancel button. The default is "Cancel".

### `<FirebaseRecaptcha>`

The reCAPTCHA v3 widget displayed inside a web-view.

#### Props

- **firebaseConfig (IFirebaseOptions)** -- Firebase web configuration.
- **firebaseVersion (string)** -- Optional version of the Firebase JavaScript SDK to load in the web-view. You can use this to load a custom or newer version. For example `version="7.9.0"`.
- **appVerificationDisabledForTesting (boolean)** -- When set, disables app verification for the purpose of testing phone authentication. When this prop is `true`, a mock reCAPTCHA is rendered. This is useful for manual testing during development or for automated integration tests. See [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth#integration-testing) for more info.
- **languageCode (string)** -- Language to display the reCAPTCHA challenge in. For a list of possible languages, see [reCAPTCHA Language Codes](https://developers.google.com/recaptcha/docs/language).
- **onLoad (function)** -- A callback that is invoked when the widget has been loaded.
- **onError (function)** -- A callback that is invoked when the widget failed to load.
- **onVerify (function)** -- A callback that is invoked when reCAPTCHA has verified that the user is not a bot. The callback is provided with the reCAPTCHA token string. Example `onVerify={(recaptchaToken: string) => this.setState({recaptchaToken})}`.
- **onFullChallenge (function)** -- A callback that is invoked when reCAPTCHA shows the full challenge experience.
- **invisible (boolean)** -- When `true` renders an `invisible` reCAPTCHA widget. The widget can then be triggered to verify invisibly by setting the `verify` prop to `true`.
- **verify (boolean)** -- Use this in combination with `invisible=true` so start the verification process.

### `<FirebaseRecaptchaBanner>`

Renders a banner referring to the Google [Privacy Policy](https://policies.google.com/privacy) and [Terms or Service](https://policies.google.com/terms). You can use this component to show the Google terms when using invisible reCAPTCHA.

#### Props

- **textStyle (object)** -- Style used for the reCAPTCHA banner text.
- **linkStyle (object)** -- Style used for the privacy and terms links text.

#### Example

```jsx
<FirebaseRecaptchaBanner
  textStyle={{ fontSize: 14, opacity: 1 }}
  linkStyle={{ fontWeight: 'bold' }}
/>
```

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

const phoneProvider = new PhoneAuthProvider();
const verificationId = await phoneProvider.verifyPhoneNumber('+0123456789', applicationVerifier);
```
