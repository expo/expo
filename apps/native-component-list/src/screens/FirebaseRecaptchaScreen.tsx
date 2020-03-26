import {
  FirebaseRecaptchaVerifierModal,
  IFirebaseAuthApplicationVerifier,
} from 'expo-firebase-recaptcha';
import * as React from 'react';
import { Alert, ScrollView } from 'react-native';

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
}

export default class FirebaseRecaptchaScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'FirebaseRecaptcha',
  };

  state: State = {
    firebaseConfig,
  };

  applicationVerifier: IFirebaseAuthApplicationVerifier | null = null;

  render() {
    const { title, cancelLabel, firebaseConfig } = this.state;
    const modalProps: any = {
      ...(title && { title }),
      ...(cancelLabel && { cancelLabel }),
      ...(firebaseConfig && { firebaseConfig }),
    };
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton onPress={this._requestRecaptchaToken} title="Request reCAPTCHA token" />
        <ListButton
          onPress={() => this.setState({ title: 'Prove you are human!' })}
          title="Set custom title"
        />
        <ListButton
          onPress={() => this.setState({ cancelLabel: 'Close' })}
          title="Set custom cancel label"
        />
        <ListButton
          onPress={() => this.setState({ title: undefined })}
          title="Reset custom title"
        />
        <ListButton
          onPress={() => this.setState({ cancelLabel: undefined })}
          title="Reset custom cancel label"
        />
        <FirebaseRecaptchaVerifierModal
          ref={ref => (this.applicationVerifier = ref)}
          {...modalProps}
        />
      </ScrollView>
    );
  }

  _requestRecaptchaToken = async () => {
    try {
      // @ts-ignore
      const token = await this.applicationVerifier.verify();
      setTimeout(
        () =>
          Alert.alert('Congratulations, you are not a bot! 🧑', `token: ${token.slice(0, 10)}...`),
        1000
      );
    } catch (e) {
      setTimeout(() => Alert.alert('Error!', e.message), 1000);
    }
  };
}
