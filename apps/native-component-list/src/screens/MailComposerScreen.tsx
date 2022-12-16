import * as MailComposer from 'expo-mail-composer';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function MailComposerScreen() {
  const [isAvailable, error] = useResolvedValue(MailComposer.isAvailableAsync);

  const warning = React.useMemo(() => {
    if (error) {
      return `An unknown error occurred while checking the API availability: ${error.message}`;
    } else if (isAvailable === null) {
      return 'Checking availability...';
    } else if (isAvailable === false) {
      // On iOS device without Mail app installed it is possible to show mail composer,
      // but it isn't possible to send that email either way.
      return `It's not possible to send an email on this device. Make sure you have mail account configured and Mail app installed (iOS).`;
    }
    return null;
  }, [error, isAvailable]);

  if (warning) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text>{warning}</Text>
      </View>
    );
  }

  return <MailComposerView />;
}

MailComposerScreen.navigationOptions = {
  title: 'MailComposer',
};

function MailComposerView() {
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
      <Button onPress={sendMailAsync} title="Send birthday wishes" />
      {status && <MonoText>Status: {status}</MonoText>}
    </View>
  );
}

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
});
