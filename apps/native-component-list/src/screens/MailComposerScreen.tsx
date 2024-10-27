import { Image } from 'expo-image';
import { openPackage } from 'expo-intent-launcher';
import { openURL } from 'expo-linking';
import * as MailComposer from 'expo-mail-composer';
import React from 'react';
import { Alert, StyleSheet, View, Platform, Text } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';

export default function MailComposerScreen() {
  const [status, setStatus] = React.useState<MailComposer.MailComposerStatus | null>(null);

  const sendMailAsync = async () => {
    try {
      const { status } = await MailComposer.composeAsync({
        subject: 'Wishes',
        body: 'Dear Friend! <b>Happy</b> Birthday, enjoy your day! 🎈',
        recipients: ['sample.mail@address.com'],
        isHtml: true,
      });
      setStatus(status);
    } catch (error) {
      console.log('Error: ', error);
      Alert.alert(`Something went wrong: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {MailComposer.getClients().map(({ label, packageName, icon, url }) => (
        <View style={styles.clientContainer} key={label}>
          {icon && <Image style={styles.image} source={icon} />}
          <Text>{label}</Text>
          <Button
            onPress={Platform.select({
              android: () => packageName && openPackage(packageName),
              ios: () => url && openURL(url),
            })}
            title="Open client"
          />
        </View>
      ))}
      <Button onPress={sendMailAsync} title="Send birthday wishes" style={styles.sendMailButton} />
      {status && <MonoText>Status: {status}</MonoText>}
    </View>
  );
}

MailComposerScreen.navigationOptions = {
  title: 'MailComposer',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 64,
    marginBottom: 32,
  },
  image: {
    width: 64,
    aspectRatio: 1,
  },
  sendMailButton: {
    marginTop: 10,
  },
});
