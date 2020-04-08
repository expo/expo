import React from 'react';
import { Platform, StyleSheet, TextInput, Alert, Text, View } from 'react-native';
import * as Google from 'expo-google-app-auth';

import Button from '../components/Button';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';

const GUIDs = Platform.select<Record<string, string>>({
  ios: {
    // bare-expo
    'dev.expo.Payments': '29635966244-v8mbqt2mtno71thelt7f2i6pob104f6e',
    // Expo client
    'host.exp.Exponent': '629683148649-rqd64l050fr7nvaottj8rhlp08q4t7da',
    [Constants.manifest.ios.bundleIdentifier]: '29635966244-td9jmh1m5trn8uuqa0je1mansia76cln',
  },
  android: {
    // bare-expo
    'dev.expo.payments': '29635966244-knmlpr1upnv6rs4bumqea7hpit4o7kg2',
    // Expo client
    'host.exp.exponent': '629683148649-8ls3mbtakmkqe2qqt9tsjugbemgrjhth',
    [Constants.manifest.android.package]: '29635966244-eql85q7fpnjncjcp6o3t3n98mgeeklc9',
  },
});

const GUID = GUIDs[Application.applicationId ?? ''];

const G_PROJECT_ID = `${GUID}.apps.googleusercontent.com`;

export default function GoogleLoginScreen() {
  const [language, onChangeLanguage] = React.useState(Localization.locale);
  const [loginHint, onChangeLoginHint] = React.useState('');

  const onPressSignInAsync = async () => {
    try {
      const result = await Google.logInAsync({
        clientId: G_PROJECT_ID,
        language,
        loginHint,
      });

      const { type } = result;

      if (type === 'success') {
        // Avoid race condition with the WebView hiding when using web-based sign in
        setTimeout(() => {
          Alert.alert('Logged in!', JSON.stringify(result), [
            {
              text: 'OK!',
              onPress: () => {
                console.log({ result });
              },
            },
          ]);
        }, 1000);
      }
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK :(', onPress: () => {} }]);
    }
  };

  if (!GUID) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Unknown Project ID {Application.applicationId}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>Project ID "{GUID}"</Text>
      <Button onPress={onPressSignInAsync} title="Authenticate with Google" />
      <View style={{ width: '80%' }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Language</Text>
          <TextInput
            style={styles.input}
            placeholder={Localization.locale}
            onChangeText={text => onChangeLanguage(text)}
            value={language}
          />
        </View>
        <View>
          <Text style={styles.label}>Login Hint</Text>
          <TextInput
            style={styles.input}
            placeholder="you@gmail.com"
            onChangeText={text => onChangeLoginHint(text)}
            value={loginHint}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    paddingBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    paddingHorizontal: 8,
    borderColor: 'gray',
    borderRadius: 2,
    borderWidth: 1,
  },
});

GoogleLoginScreen.navigationOptions = {
  title: 'Google',
};
