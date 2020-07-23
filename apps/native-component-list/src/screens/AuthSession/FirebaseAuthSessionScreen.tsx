import { H2 } from '@expo/html-elements';
import * as AuthSession from 'expo-auth-session';
import * as FacebookAuthSession from 'expo-auth-session/providers/Facebook';
import * as GoogleAuthSession from 'expo-auth-session/providers/Google';
import { maybeCompleteAuthSession } from 'expo-web-browser';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { getGUID } from '../../api/guid';
import TitledPicker from '../../components/TitledPicker';
import TitledSwitch from '../../components/TitledSwitch';
import { AuthSection } from './AuthResult';

// import firebase from 'firebase/app';
// import 'firebase/auth';
maybeCompleteAuthSession();

// Initialize Firebase
// if (!firebase.apps.length) {
//   firebase.initializeApp({
//     /* Config */
//   });
// }

const languages = [
  { key: 'en', value: 'English' },
  { key: 'pl', value: 'Polish' },
  { key: 'nl', value: 'Dutch' },
  { key: 'fi', value: 'Finnish' },
];
export default function FirebaseAuthSessionScreen() {
  const [language, setLanguage] = React.useState<any>(languages[0].key);
  const [selectAccount, setSelectAccount] = React.useState(false);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ScrollView
        contentContainerStyle={{
          maxWidth: 640,
          paddingHorizontal: 12,
        }}>
        <View style={{ marginBottom: 8 }}>
          <H2>Settings</H2>
          <TitledSwitch
            title="Switch Accounts"
            value={selectAccount}
            setValue={value => setSelectAccount(value)}
          />
          <TitledPicker
            items={languages}
            title="Language"
            value={language}
            setValue={setLanguage}
          />
        </View>
        <H2>Services</H2>
        <AuthSessionProviders selectAccount={selectAccount} language={language} />
      </ScrollView>
    </View>
  );
}

FirebaseAuthSessionScreen.navigationOptions = {
  title: 'Firebase AuthSession',
};

type ProviderProps = { selectAccount: boolean; language: string };

function AuthSessionProviders(props: ProviderProps) {
  return (
    <View style={{ flex: 1 }}>
      {[Google, Facebook].map((Provider, index) => (
        <Provider key={`-${index}`} {...props} />
      ))}
    </View>
  );
}

function Google({ language, selectAccount }: ProviderProps) {
  const [request, result, promptAsync] = GoogleAuthSession.useAuthRequest(
    {
      expoClientId: '629683148649-qevd4mfvh06q14i4nl453r62sgd1p85d.apps.googleusercontent.com',
      clientId: `${getGUID()}.apps.googleusercontent.com`,
      selectAccount,
      language,
      responseType: AuthSession.ResponseType.IdToken,
    },
    {
      path: 'redirect',
      preferLocalhost: true,
    }
  );

  return (
    <AuthSection
      request={request}
      title="google"
      result={result}
      promptAsync={() => promptAsync()}
    />
  );
}

function Facebook({ language, selectAccount }: ProviderProps) {
  const [request, result, promptAsync] = FacebookAuthSession.useAuthRequest(
    {
      clientId: '145668956753819',
      language,
      selectAccount,
      responseType: AuthSession.ResponseType.Token,
    },
    {
      path: 'redirect',
      preferLocalhost: true,
    }
  );
  // Add fetch user example

  return (
    <AuthSection
      title="facebook"
      request={request}
      result={result}
      promptAsync={() => promptAsync()}
    />
  );
}
