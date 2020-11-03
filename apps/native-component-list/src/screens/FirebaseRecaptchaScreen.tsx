import {
  FirebaseAuthApplicationVerifier,
  FirebaseRecaptchaVerifierModal,
} from 'expo-firebase-recaptcha';
import * as React from 'react';
import { Alert, ScrollView, StyleProp, TextStyle } from 'react-native';

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

interface State {
  title?: string;
  cancelLabel?: string;
  firebaseConfig?: any;
  inProgress: boolean;
  textStyle?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  appVerificationDisabledForTesting: boolean;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class FirebaseRecaptchaScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'FirebaseRecaptcha',
  };

  state: State = {
    firebaseConfig,
    inProgress: false,
    textStyle: undefined,
    linkStyle: undefined,
    appVerificationDisabledForTesting: false,
  };

  recaptchaVerifier: FirebaseAuthApplicationVerifier | null = null;

  render() {
    const {
      title,
      cancelLabel,
      firebaseConfig,
      inProgress,
      appVerificationDisabledForTesting,
    } = this.state;
    const modalProps: any = {
      ...(title && { title }),
      ...(cancelLabel && { cancelLabel }),
      ...(firebaseConfig && { firebaseConfig }),
    };
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={this.requestRecaptchaToken}
          title={inProgress ? 'Requesting reCAPTCHA token...' : 'Request reCAPTCHA token'}
        />
        <ListButton
          onPress={() =>
            this.setState(state => ({
              appVerificationDisabledForTesting: !state.appVerificationDisabledForTesting,
            }))
          }
          title={`Toggle appVerificationDisabledForTesting (${
            appVerificationDisabledForTesting ? 'On' : 'Off'
          })`}
        />
        <ListButton
          onPress={() =>
            this.setState(state => ({ title: state.title ? undefined : 'Prove you are human!' }))
          }
          title={`Toggle custom title (${title ? 'On' : 'Off'})`}
        />
        <ListButton
          onPress={() =>
            this.setState(state => ({ cancelLabel: state.cancelLabel ? undefined : 'Close' }))
          }
          title={`Toggle custom cancel label (${cancelLabel ? 'On' : 'Off'})`}
        />
        <FirebaseRecaptchaVerifierModal
          ref={ref => (this.recaptchaVerifier = ref)}
          appVerificationDisabledForTesting={appVerificationDisabledForTesting}
          {...modalProps}
        />
      </ScrollView>
    );
  }

  private requestRecaptchaToken = async () => {
    this.setState({ inProgress: true });
    try {
      // @ts-ignore
      const token = await this.recaptchaVerifier.verify();
      setTimeout(
        () =>
          Alert.alert('Congratulations, you are not a bot! 🧑', `token: ${token.slice(0, 10)}...`),
        1000
      );
    } catch (e) {
      setTimeout(() => Alert.alert('Error!', e.message), 1000);
    }
    setTimeout(() => this.setState({ inProgress: false }), 1000);
  };
}
