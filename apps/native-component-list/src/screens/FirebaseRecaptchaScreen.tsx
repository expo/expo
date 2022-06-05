import {
  FirebaseAuthApplicationVerifier,
  FirebaseRecaptchaVerifierModal,
  FirebaseRecaptchaBanner,
} from 'expo-firebase-recaptcha';
import * as React from 'react';
import { Alert, ScrollView, StyleSheet, StyleProp, TextStyle, Platform } from 'react-native';

import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';

const firebaseConfig = {
  apiKey: 'AIzaSyDKP919EwHK1U3Q1bgJdQEwZCHs_z6lEK4',
  authDomain: 'expo-firebase-demo.firebaseapp.com',
  databaseURL: 'https://expo-firebase-demo.firebaseio.com',
  projectId: 'expo-firebase-demo',
  storageBucket: 'expo-firebase-demo.appspot.com',
  messagingSenderId: '192261076942',
  appId: '1:192261076942:web:0bc88d1971ffb0c1359d9f',
  measurementId: 'G-10P86NHER4',
};

export default function FirebaseRecaptchaScreen() {
  const [inProgress, setInProgress] = React.useState(false);
  const [attemptInvisibleVerification, setAttemptInvisibleVerification] = React.useState(false);
  const [appVerificationDisabledForTesting, setAppVerificationDisabledForTesting] = React.useState(false);
  const [languageCode, setLanguageCode] = React.useState('en');
  const [title, setTitle] = React.useState(undefined);
  const [cancelLabel, setCancelLabel] = React.useState(undefined);
  const [textStyle, setTextStyle] = React.useState(undefined);
  const [linkStyle, setLinkStyle] = React.useState(undefined);

  const recaptchaVerifier = React.useRef(null);

  const requestRecaptchaToken = React.useCallback(async () => {
    setInProgress(true);
    try {
      // @ts-ignore
      const token = await recaptchaVerifier.current.verify();
      setTimeout(() => {
        Alert.alert('Congratulations, you are not a bot! 🧑', `token: ${token.slice(0, 10)}...`);
      }, 1000);
    } catch (e) {
      setTimeout(() => Alert.alert('Error!', e.message), 1000);
    }
    setTimeout(() => setInProgress(false), 1000);
  }, []);

  return (
    <ScrollView style={{ padding: 10 }}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        {...{ firebaseConfig, title, cancelLabel, appVerificationDisabledForTesting, attemptInvisibleVerification, languageCode }}
      />

      <ListButton
        onPress={requestRecaptchaToken}
        title={inProgress ? 'Requesting reCAPTCHA token...' : 'Request reCAPTCHA token'}
      />
      <ListButton
        onPress={() => setAttemptInvisibleVerification((prev) => !prev)}
        title={`Toggle attemptInvisibleVerification (${attemptInvisibleVerification ? 'On' : 'Off'
          })`}
      />
      <ListButton
        onPress={() => setAppVerificationDisabledForTesting((prev) => !prev)}
        title={`Toggle appVerificationDisabledForTesting (${appVerificationDisabledForTesting ? 'On' : 'Off'
          })`}
      />
      <ListButton
        onPress={() => setLanguageCode((prev) => (prev === 'en' ? 'zh-CN' : 'en'))}
        title={`Toggle languageCode (${languageCode})`}
      />
      <ListButton
        onPress={() => setTitle((prev) => (prev ? undefined : 'Prove you are human!'))}
        title={`Toggle custom title (${title ? 'On' : 'Off'})`}
      />
      <ListButton
        onPress={() => setCancelLabel((prev) => (prev ? undefined : 'Close'))}
        title={`Toggle custom cancel label (${cancelLabel ? 'On' : 'Off'})`}
      />

      <HeadingText>reCAPTCHA banner</HeadingText>
      <ListButton
        onPress={() => setTextStyle((prev) => (prev ? undefined : styles.invisibleRecaptchaText))}
        title={`Toggle custom banner text-style" (${textStyle ? 'On' : 'Off'})`}
      />
      <ListButton
        onPress={() => setLinkStyle((prev) => (prev ? undefined : styles.invisibleRecaptchaLink))}
        title={`Toggle custom banner link-style" (${linkStyle ? 'On' : 'Off'})`}
      />
      <FirebaseRecaptchaBanner style={styles.banner} textStyle={textStyle} linkStyle={linkStyle} />
    </ScrollView>
  );
}

FirebaseRecaptchaScreen.navigationOptions = {
  title: 'FirebaseRecaptcha',
};

const styles = StyleSheet.create({
  banner: {
    marginVertical: 10,
  },
  invisibleRecaptchaText: {
    opacity: 1,
    fontSize: 14,
  },
  invisibleRecaptchaLink: {
    fontWeight: 'bold',
    color: 'purple',
  },
});
