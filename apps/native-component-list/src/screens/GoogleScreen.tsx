import * as Google from 'expo-google-app-auth';
import * as Localization from 'expo-localization';
import React from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { getGUID } from '../api/guid';
import Button from '../components/Button';

export default function GoogleLoginScreen() {
  const GUID = getGUID();
  const G_PROJECT_ID = `${GUID}.apps.googleusercontent.com`;
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
            onChangeText={(text) => onChangeLanguage(text)}
            value={language}
          />
        </View>
        <View>
          <Text style={styles.label}>Login Hint</Text>
          <TextInput
            style={styles.input}
            placeholder="you@gmail.com"
            onChangeText={(text) => onChangeLoginHint(text)}
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
