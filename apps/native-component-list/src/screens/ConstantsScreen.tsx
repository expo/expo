import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

function ExpoConstant({ name }: { name: string }) {
  const [evaluated, setEvaluated] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  useEffect(() => {
    let value = Constants[name];
    (async () => {
      if (typeof value === 'function') {
        try {
          value = await value();
        } catch (error) {
          console.error(error);
          return setError(error.message);
        }
      }

      if (typeof value === 'object') {
        value = JSON.stringify(value, null, 2);
      } else if (typeof value === 'boolean') {
        value = value ? 'true' : 'false';
      }
      setEvaluated(value);
    })();
  }, [name]);

  return (
    <View style={{ marginBottom: 10 }}>
      <HeadingText>{name}</HeadingText>
      <MonoText containerStyle={error ? { borderColor: 'red' } : {}}>{error ?? evaluated}</MonoText>
    </View>
  );
}

// Ignore deprecated properties
const IGNORED_CONSTANTS = ['__unsafeNoWarnManifest', 'linkingUrl'];

export default function ConstantsScreen() {
  return (
    <ScrollView style={{ padding: 10, flex: 1, backgroundColor: Colors.greyBackground }}>
      {Object.keys(Constants)
        .filter((value) => !IGNORED_CONSTANTS.includes(value))
        .sort()
        .map((key) => {
          if (typeof Constants[key] === 'function') return null;
          return <ExpoConstant name={key} key={key} />;
        })}
      <ExpoConstant name="getWebViewUserAgentAsync" />
    </ScrollView>
  );
}
