import Constants, { AppOwnership } from 'expo-constants';
import * as Linking from 'expo-linking';
import React from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

async function canOpenURL(url: string): Promise<boolean> {
  if (Constants.appOwnership === AppOwnership.Expo) {
    return true;
  }
  return Linking.canOpenURL(url);
}

function TextInputButton({ text }: { text: string }) {
  const [link, setLink] = React.useState<string>(text);
  const [parsed, setParsed] = React.useState<string>('');
  const [canOpen, setCanOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    onChangeText(text);
  }, [text]);

  const onChangeText = async (text: string) => {
    let parsedTextResult = '';
    const supported = await canOpenURL(text);
    if (supported) {
      const parsedText = await Linking.parse(text);
      parsedTextResult = JSON.stringify(parsedText, null, 2);
    }

    setLink(text);
    setParsed(parsedTextResult);
    setCanOpen(supported);
  };

  const handleClick = async () => {
    try {
      const supported = await canOpenURL(link);

      if (supported) {
        Linking.openURL(link);
      } else {
        const message = `Don't know how to open URI: ${link}`;
        console.log(message);
        alert(message);
      }
    } catch ({ message }) {
      console.error(message);
    }
  };

  const buttonTitle = canOpen ? 'Open 😁' : 'Cannot Open 😕';
  return (
    <View>
      <View style={styles.textInputContainer}>
        <TextInput style={styles.textInput} onChangeText={onChangeText} value={link} />
        <Button title={buttonTitle} onPress={handleClick} disabled={!canOpen} />
      </View>
      <MonoText containerStyle={styles.itemText}>{parsed}</MonoText>
    </View>
  );
}

export default function LinkingScreen() {
  const useURL = Linking.useURL();
  const useLinkingURL = Linking.useLinkingURL();
  const [eventListenerURL, setEventListenerURL] = React.useState<string>();

  React.useEffect(() => {
    const listener = Linking.addEventListener('url', ({ url }) => {
      setEventListenerURL(url);
    });

    return listener.remove;
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Button
        title="Open Settings"
        onPress={() => {
          Linking.openSettings();
        }}
      />
      {useURL && <TextInputButton text={Linking.createURL('deep-link')} />}
      <View>
        <MonoText containerStyle={styles.itemText}>Linking.useURL: {useURL}</MonoText>
      </View>
      <View>
        <MonoText containerStyle={styles.itemText}>Linking.useLinkingURL: {useLinkingURL}</MonoText>
      </View>
      <View>
        <MonoText containerStyle={styles.itemText}>
          Linking.addEventListener: {eventListenerURL}
        </MonoText>
      </View>
      <TextInputButton text="https://github.com/search?q=Expo" />
      <TextInputButton text="https://www.expo.dev" />
      <TextInputButton text="http://www.expo.dev" />
      <TextInputButton text="http://expo.dev" />
      <TextInputButton text="fb://notifications" />
      <TextInputButton text="geo:37.484847,-122.148386" />
      <TextInputButton text="tel:9876543210" />
    </ScrollView>
  );
}

LinkingScreen.navigationOptions = {
  title: 'Linking',
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  textInputContainer: {
    flexDirection: 'row',
    maxWidth: '100%',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  textInput: {
    height: 40,
    flex: 1,
    borderColor: Colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  itemText: {
    borderWidth: 0,
    flex: 1,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 18,
    paddingLeft: 12,
  },
});
