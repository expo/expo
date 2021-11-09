import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { getApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, PhoneAuthProvider, UserCredential } from 'firebase/auth';
import * as React from 'react';
import { Alert, ScrollView, TextInput, LogBox } from 'react-native';

import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import { firebaseConfig } from './FirebaseRecaptchaScreen';

// See: https://github.com/firebase/firebase-js-sdk/issues/1847
LogBox.ignoreLogs(['AsyncStorage has been extracted']);

try {
  // Try to initialize, if it doesn't work its already registered
  initializeApp(firebaseConfig);
} catch (e) {}

export default function FirebasePhoneAuthScreen() {
  const recaptchaVerifier = React.useRef(null);
  const [phone, setPhone] = React.useState('');
  const [verifyId, setVerifyId] = React.useState('');
  const [verifyCode, setVerifyCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<UserCredential | null>(null);

  const onRequestCode = React.useCallback(async () => {
    if (!recaptchaVerifier.current) {
      return Alert.alert(
        'Firebase recaptcha verifier needs to be loaded before verifying phone numbers'
      );
    }
    setLoading(true);
    try {
      const provider = new PhoneAuthProvider(getAuth());
      const id = await provider.verifyPhoneNumber(phone, recaptchaVerifier.current);
      setVerifyId(id);
    } catch (error) {
      Alert.alert(`Failed requesting a verification code: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [recaptchaVerifier, phone]);

  const onValidateCode = React.useCallback(async () => {
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verifyId, verifyCode);
      const user = await signInWithCredential(getAuth(), credential);
      setUser(user);
    } catch (error) {
      Alert.alert(`Failed to verify code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [verifyId, verifyCode]);

  return (
    <ScrollView style={{ padding: 10 }}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={getApp().options}
        attemptInvisibleVerification
      />

      <HeadingText>Enter phone number</HeadingText>
      <TextInput
        autoFocus
        autoCompleteType="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        placeholder="+1 999 999 9999"
        onChangeText={setPhone}
        style={{ paddingVertical: 10 }}
      />
      <ListButton
        disabled={!verifyId && loading}
        title={!verifyId ? 'Request verification code' : 'Verification code sent!'}
        onPress={onRequestCode}
      />

      <HeadingText>Enter verification code</HeadingText>
      <TextInput
        editable={!!verifyId}
        autoCompleteType="off"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        placeholder="999 999"
        onChangeText={setVerifyCode}
        style={{ paddingVertical: 10 }}
      />
      <ListButton disabled={!verifyId || loading} title="Verify code" onPress={onValidateCode} />

      {!!user && (
        <HeadingText>
          Hi {user.user?.phoneNumber}! #{user.user?.uid}
        </HeadingText>
      )}
    </ScrollView>
  );
}

FirebasePhoneAuthScreen.navigationOptions = {
  title: 'FirebasePhoneAuth',
};
