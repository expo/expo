import { H1, H3 } from '@expo/html-elements';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { View } from 'react-native';

export default function RedirectScreen() {
  const payload = WebBrowser.maybeCompleteAuthSession();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <H1>Redirect loading...</H1>
      <H3>{payload.message}</H3>
    </View>
  );
}

RedirectScreen.path = 'redirect';
