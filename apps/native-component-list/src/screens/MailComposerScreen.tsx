import * as MailComposer from 'expo-mail-composer';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

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
      <Button
        onPress={() =>
          MailComposer.openClientAsync({
            title: 'Which email app do you use?',
            cancelLabel: 'Cancel',
          })
        }
        title="Open client"
      />
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
  capabilitiesContainer: {
    alignItems: 'stretch',
    paddingBottom: 20,
  },
  sendMailButton: {
    marginTop: 10,
  },
});
